using FluentValidation;
using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Application.UseCases.Dentistas;
using OdontoCloud.Domain.Entities;

namespace OdontoCloud.Application.UseCases.Agendamentos.Commands;

public sealed class UpdateAgendamentoCommandHandler : IRequestHandler<UpdateAgendamentoCommand, AgendamentoDto?>
{
    private readonly IAgendamentoRepository _agendamentoRepository;
    private readonly IDentistaRepository _dentistaRepository;

    public UpdateAgendamentoCommandHandler(
        IAgendamentoRepository agendamentoRepository,
        IDentistaRepository dentistaRepository)
    {
        _agendamentoRepository = agendamentoRepository;
        _dentistaRepository = dentistaRepository;
    }

    public async Task<AgendamentoDto?> Handle(UpdateAgendamentoCommand request, CancellationToken cancellationToken)
    {
        var agendamento = await _agendamentoRepository.GetByIdAsync(request.AgendamentoId, cancellationToken);
        if (agendamento is null)
        {
            return null;
        }

        var dentista = await _dentistaRepository.GetByIdAsync(request.DentistaId, cancellationToken);
        if (dentista is null)
        {
            throw new ValidationException("Dentista não encontrado.");
        }

        GarantirDentroDaAgenda(dentista, request.DataHora, request.DuracaoMinutos);

        var hasOverlappingAppointment = await _agendamentoRepository.HasOverlappingAppointmentAsync(
            request.DentistaId,
            request.DataHora,
            request.DuracaoMinutos,
            request.AgendamentoId,
            cancellationToken);

        if (hasOverlappingAppointment)
        {
            throw new ValidationException("O dentista já possui um agendamento neste horário");
        }

        agendamento.AtualizarDados(
            request.PacienteId,
            request.DentistaId,
            request.DataHora,
            request.DuracaoMinutos,
            request.Status,
            request.Procedimento,
            request.Observacoes);

        await _agendamentoRepository.SaveChangesAsync(cancellationToken);

        var refreshedAgendamento = await _agendamentoRepository.GetByIdAsync(request.AgendamentoId, cancellationToken);
        if (refreshedAgendamento is null)
        {
            return null;
        }

        return new AgendamentoDto(
            refreshedAgendamento.Id,
            refreshedAgendamento.PacienteId,
            refreshedAgendamento.Paciente?.Nome ?? string.Empty,
            refreshedAgendamento.DentistaId,
            refreshedAgendamento.Dentista?.Nome ?? string.Empty,
            refreshedAgendamento.DataHora,
            refreshedAgendamento.DuracaoMinutos,
            refreshedAgendamento.Status,
            refreshedAgendamento.Procedimento,
            refreshedAgendamento.Observacoes);
    }

    private static void GarantirDentroDaAgenda(
        Dentista dentista,
        DateTime dataHora,
        int duracaoMinutos)
    {
        var config = DentistaAgendaConfigParser.ParseOrDefault(dentista.AgendaConfigJson);
        if (!config.EstaDentroDaAgenda(dataHora, duracaoMinutos))
        {
            throw new ValidationException("O horário informado não está dentro da agenda configurada para o dentista.");
        }
    }
}
