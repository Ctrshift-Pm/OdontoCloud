using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdontoCloud.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Clinicas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Cnpj = table.Column<string>(type: "character varying(18)", maxLength: 18, nullable: true),
                    Plano = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Ativa = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clinicas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Pacientes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Cpf = table.Column<string>(type: "character varying(14)", maxLength: 14, nullable: false),
                    DataNascimento = table.Column<DateOnly>(type: "date", nullable: true),
                    TelefoneWhatsapp = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Convenio = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Cidade = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DentistaResponsavelId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ClinicaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pacientes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Perfil = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ClinicaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioPermissoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Modulo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Acao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Permitido = table.Column<bool>(type: "boolean", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioPermissoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UsuarioPermissoes_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Pacientes_ClinicaId_Cpf",
                table: "Pacientes",
                columns: new[] { "ClinicaId", "Cpf" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioPermissoes_UsuarioId",
                table: "UsuarioPermissoes",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_ClinicaId_Email",
                table: "Usuarios",
                columns: new[] { "ClinicaId", "Email" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Clinicas");

            migrationBuilder.DropTable(
                name: "Pacientes");

            migrationBuilder.DropTable(
                name: "UsuarioPermissoes");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
