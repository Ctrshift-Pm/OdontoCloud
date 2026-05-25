using MediatR;

namespace OdontoCloud.Application.UseCases.Dashboard;

public sealed record GetDashboardResumoQuery() : IRequest<DashboardResumoDto>;
