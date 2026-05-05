using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdontoCloud.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceiroReceber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ContasReceber",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PacienteId = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemPlanoTratamentoId = table.Column<Guid>(type: "uuid", nullable: true),
                    ValorBase = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    Desconto = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    ValorFinal = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    DataVencimento = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataPagamento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FormaPagamento = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    UsuarioBaixaId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ClinicaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContasReceber", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContasReceber_ItensPlanoTratamento_ItemPlanoTratamentoId",
                        column: x => x.ItemPlanoTratamentoId,
                        principalTable: "ItensPlanoTratamento",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ContasReceber_Pacientes_PacienteId",
                        column: x => x.PacienteId,
                        principalTable: "Pacientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContasReceber_ClinicaId_PacienteId_Status",
                table: "ContasReceber",
                columns: new[] { "ClinicaId", "PacienteId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ContasReceber_ItemPlanoTratamentoId",
                table: "ContasReceber",
                column: "ItemPlanoTratamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_ContasReceber_PacienteId",
                table: "ContasReceber",
                column: "PacienteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContasReceber");
        }
    }
}
