namespace OdontoCloud.Application.UseCases.Dashboard;

public sealed record DashboardKanbanStatusResumoDto(
    string Status,
    int Quantidade);

public sealed record DashboardProximoAgendamentoResumoDto(
    string PacienteNome,
    string DentistaNome,
    DateTime DataHora,
    string Status,
    string Procedimento);

public sealed record DashboardResumoDto(
    int TotalPacientes,
    IReadOnlyList<DashboardKanbanStatusResumoDto> PacientesPorStatusKanban,
    int AgendamentosHoje,
    int AgendamentosProximos,
    int ContasReceberPendentes,
    int ContasPagarPendentes,
    decimal TotalPendenteReceber,
    decimal TotalPendentePagar,
    IReadOnlyList<DashboardProximoAgendamentoResumoDto> ProximosAgendamentos);
