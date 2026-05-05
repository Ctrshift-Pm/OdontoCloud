using FluentValidation;
using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Entities;
using OdontoCloud.Application.UseCases.Dentistas;

namespace OdontoCloud.Application.UseCases.Agendamentos.Commands;

public sealed class CreateAgendamentoCommandHandler : IRequestHandler<CreateAgendamentoCommand, AgendamentoDto>
{
    private readonly IAgendamentoRepository _agendamentoRepository;
    private readonly IDentistaRepository _dentistaRepository;

    public CreateAgendamentoCommandHandler(
        IAgendamentoRepository agendamentoRepository,
        IDentistaRepository dentistaRepository)
    {
        _agendamentoRepository = agendamentoRepository;
        _dentistaRepository = dentistaRepository;
    }

    public async Task<AgendamentoDto> Handle(CreateAgendamentoCommand request, CancellationToken cancellationToken)
    {
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
            null,
            cancellationToken);

        if (hasOverlappingAppointment)
        {
            throw new ValidationException("O dentista já possui um agendamento neste horário");
        }

        var agendamento = new Agendamento(
            request.PacienteId,
            request.DentistaId,
            request.DataHora,
            request.DuracaoMinutos,
            request.Status,
            request.Procedimento,
            request.Observacoes);

        await _agendamentoRepository.AddAsync(agendamento, cancellationToken);
        await _agendamentoRepository.SaveChangesAsync(cancellationToken);

        return new AgendamentoDto(
            agendamento.Id,
            agendamento.PacienteId,
            string.Empty,
            agendamento.DentistaId,
            string.Empty,
            agendamento.DataHora,
            agendamento.DuracaoMinutos,
            agendamento.Status,
            agendamento.Procedimento,
            agendamento.Observacoes);
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
