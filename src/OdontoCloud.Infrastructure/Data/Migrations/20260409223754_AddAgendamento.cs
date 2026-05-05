using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdontoCloud.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAgendamento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Dentistas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Especialidade = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ClinicaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dentistas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Agendamentos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PacienteId = table.Column<Guid>(type: "uuid", nullable: false),
                    DentistaId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataHora = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DuracaoMinutos = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Procedimento = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Observacoes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ClinicaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Agendamentos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Agendamentos_Dentistas_DentistaId",
                        column: x => x.DentistaId,
                        principalTable: "Dentistas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Agendamentos_Pacientes_PacienteId",
                        column: x => x.PacienteId,
                        principalTable: "Pacientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Agendamentos_ClinicaId_DentistaId_DataHora",
                table: "Agendamentos",
                columns: new[] { "ClinicaId", "DentistaId", "DataHora" });

            migrationBuilder.CreateIndex(
                name: "IX_Agendamentos_DentistaId",
                table: "Agendamentos",
                column: "DentistaId");

            migrationBuilder.CreateIndex(
                name: "IX_Agendamentos_PacienteId",
                table: "Agendamentos",
                column: "PacienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Dentistas_ClinicaId_Nome",
                table: "Dentistas",
                columns: new[] { "ClinicaId", "Nome" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Agendamentos");

            migrationBuilder.DropTable(
                name: "Dentistas");
        }
    }
}
