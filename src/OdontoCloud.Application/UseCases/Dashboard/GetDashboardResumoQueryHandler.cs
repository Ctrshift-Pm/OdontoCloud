using MediatR;
using OdontoCloud.Application.Interfaces;
using OdontoCloud.Domain.Enums;

namespace OdontoCloud.Application.UseCases.Dashboard;

public sealed class GetDashboardResumoQueryHandler : IRequestHandler<GetDashboardResumoQuery, DashboardResumoDto>
{
    private static readonly HashSet<string> StatusAtivosOuFuturos = Enum.GetValues<StatusAgendamento>()
        .Where(status => status is not StatusAgendamento.Cancelado)
        .Select(status => status.ToString())
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    private readonly IPacienteRepository _pacienteRepository;
    private readonly IAgendamentoRepository _agendamentoRepository;
    private readonly IContaReceberRepository _contaReceberRepository;
    private readonly IContaPagarRepository _contaPagarRepository;

    public GetDashboardResumoQueryHandler(
        IPacienteRepository pacienteRepository,
        IAgendamentoRepository agendamentoRepository,
        IContaReceberRepository contaReceberRepository,
        IContaPagarRepository contaPagarRepository)
    {
        _pacienteRepository = pacienteRepository;
        _agendamentoRepository = agendamentoRepository;
        _contaReceberRepository = contaReceberRepository;
        _contaPagarRepository = contaPagarRepository;
    }

    public async Task<DashboardResumoDto> Handle(GetDashboardResumoQuery request, CancellationToken cancellationToken)
    {
        var pacienteResume = await _pacienteRepository.GetAllAsync(cancellationToken);
        var pacientes = pacienteResume.ToList();
        var hoje = DateTime.UtcNow.Date;
        var agoraUtc = DateTime.UtcNow;

        var agendamentosHoje = await _agendamentoRepository.GetFromRangeAsync(
            hoje,
            hoje.AddDays(1),
            cancellationToken: cancellationToken);

        var agendamentosProximos = await _agendamentoRepository.GetFromRangeAsync(
            hoje,
            hoje.AddDays(7),
            cancellationToken: cancellationToken);

        var contasReceberPendentes = await _contaReceberRepository.GetPorPeriodoEStatusAsync(
            null,
            null,
            StatusContaReceber.Pendente,
            cancellationToken);
        var contasReceberParciais = await _contaReceberRepository.GetPorPeriodoEStatusAsync(
            null,
            null,
            StatusContaReceber.Parcial,
            cancellationToken);
        var contasReceberAtrasadas = await _contaReceberRepository.GetPorPeriodoEStatusAsync(
            null,
            null,
            StatusContaReceber.Atrasado,
            cancellationToken);

        var contasPagarPendentes = await _contaPagarRepository.GetPendentesEAtrasadasAsync(cancellationToken);

        var contasReceberParaResumo = contasReceberPendentes
            .Select(conta => new { Conta = conta, Status = ResolverStatusContaReceber(conta, agoraUtc) })
            .Concat(contasReceberParciais.Select(conta => new { Conta = conta, Status = ResolverStatusContaReceber(conta, agoraUtc) }))
            .Concat(contasReceberAtrasadas.Select(conta => new { Conta = conta, Status = ResolverStatusContaReceber(conta, agoraUtc) }))
            .DistinctBy(conta => conta.Conta.Id)
            .ToList();

        var listaAgendamentos = agendamentosProximos
            .Where(agendamento => StatusAtivosOuFuturos.Contains(agendamento.Status))
            .OrderBy(agendamento => agendamento.DataHora)
            .Take(8)
            .Select(agendamento => new DashboardProximoAgendamentoResumoDto(
                agendamento.Paciente?.Nome ?? string.Empty,
                agendamento.Dentista?.Nome ?? string.Empty,
                agendamento.DataHora,
                agendamento.Status,
                agendamento.Procedimento))
            .ToList();

        return new DashboardResumoDto(
            TotalPacientes: pacientes.Count,
            PacientesPorStatusKanban: MontarResumoKanban(pacientes).ToList(),
            AgendamentosHoje: agendamentosHoje.Count(agendamento => StatusAtivosOuFuturos.Contains(agendamento.Status)),
            AgendamentosProximos: listaAgendamentos.Count,
            ContasReceberPendentes: contasReceberParaResumo.Count,
            ContasPagarPendentes: contasPagarPendentes.Count,
            TotalPendenteReceber: contasReceberParaResumo.Sum(conta => conta.Conta.ValorFinal),
            TotalPendentePagar: contasPagarPendentes.Sum(conta => conta.Valor),
            ProximosAgendamentos: listaAgendamentos);
    }

    private static IEnumerable<DashboardKanbanStatusResumoDto> MontarResumoKanban(IReadOnlyCollection<Domain.Entities.Paciente> pacientes)
    {
        var totais = Enum.GetNames<CrmKanbanStatus>()
            .ToDictionary(
                status => status,
                _ => 0,
                StringComparer.OrdinalIgnoreCase);

        foreach (var paciente in pacientes)
        {
            if (totais.TryGetValue(paciente.CrmKanbanStatus.ToString(), out var totalAtual))
            {
                totais[paciente.CrmKanbanStatus.ToString()] = totalAtual + 1;
            }
        }

        return totais.Select(kv => new DashboardKanbanStatusResumoDto(kv.Key, kv.Value));
    }

    private static string ResolverStatusContaReceber(Domain.Entities.ContaReceber conta, DateTime agoraUtc)
    {
        if ((conta.Status == StatusContaReceber.Pendente.ToString() || conta.Status == StatusContaReceber.Parcial.ToString()) &&
            agoraUtc.Date > conta.DataVencimento.Date)
        {
            return StatusContaReceber.Atrasado.ToString();
        }

        return conta.Status;
    }
}
