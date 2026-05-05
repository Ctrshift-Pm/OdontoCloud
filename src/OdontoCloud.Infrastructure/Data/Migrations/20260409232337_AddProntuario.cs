using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdontoCloud.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProntuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Prontuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PacienteId = table.Column<Guid>(type: "uuid", nullable: false),
                    AnamneseJson = table.Column<string>(type: "jsonb", nullable: false),
                    OdontogramaJson = table.Column<string>(type: "jsonb", nullable: false),
                    AnamneseAtualizadaEmUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    OdontogramaAtualizadoEmUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ClinicaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Prontuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Prontuarios_Pacientes_PacienteId",
                        column: x => x.PacienteId,
                        principalTable: "Pacientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ItensPlanoTratamento",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProntuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    PacienteId = table.Column<Guid>(type: "uuid", nullable: false),
                    DenteFdi = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    StatusOdontograma = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Procedimento = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ValorBase = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ClinicaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItensPlanoTratamento", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItensPlanoTratamento_Prontuarios_ProntuarioId",
                        column: x => x.ProntuarioId,
                        principalTable: "Prontuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProntuarioAuditorias",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProntuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    TipoAlteracao = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AlteradoEmUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DetalhesJson = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ClinicaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProntuarioAuditorias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProntuarioAuditorias_Prontuarios_ProntuarioId",
                        column: x => x.ProntuarioId,
                        principalTable: "Prontuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ItensPlanoTratamento_ClinicaId_PacienteId",
                table: "ItensPlanoTratamento",
                columns: new[] { "ClinicaId", "PacienteId" });

            migrationBuilder.CreateIndex(
                name: "IX_ItensPlanoTratamento_ProntuarioId",
                table: "ItensPlanoTratamento",
                column: "ProntuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_ProntuarioAuditorias_ClinicaId_ProntuarioId",
                table: "ProntuarioAuditorias",
                columns: new[] { "ClinicaId", "ProntuarioId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProntuarioAuditorias_ProntuarioId",
                table: "ProntuarioAuditorias",
                column: "ProntuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Prontuarios_ClinicaId_PacienteId",
                table: "Prontuarios",
                columns: new[] { "ClinicaId", "PacienteId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Prontuarios_PacienteId",
                table: "Prontuarios",
                column: "PacienteId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItensPlanoTratamento");

            migrationBuilder.DropTable(
                name: "ProntuarioAuditorias");

            migrationBuilder.DropTable(
                name: "Prontuarios");
        }
    }
}
