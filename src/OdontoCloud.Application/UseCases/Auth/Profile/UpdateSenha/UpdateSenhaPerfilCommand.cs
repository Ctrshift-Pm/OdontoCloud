using MediatR;

namespace OdontoCloud.Application.UseCases.Auth.Profile.UpdateSenha;

public sealed record UpdateSenhaPerfilCommand(
    string SenhaAtual,
    string NovaSenha,
    string ConfirmacaoSenha) : IRequest<bool>;
