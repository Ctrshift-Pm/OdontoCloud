using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdontoCloud.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddContasPagarEComissoes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "ItensPlanoTratamento",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Orcado",
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30);

            migrationBuilder.AddColumn<Guid>(
                name: "DentistaId",
                table: "ItensPlanoTratamento",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegraComissaoJson",
                table: "Dentistas",
                type: "jsonb",
                nullable: false,
                defaultValue: "{\"tipo\":\"PercentualFixo\",\"percentual\":30}");

            migrationBuilder.AddColumn<Guid>(
                name: "DentistaId",
                table: "ContasReceber",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ContasPagar",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FornecedorDestinatario = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Categoria = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Valor = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    DataVencimento = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataPagamento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UsuarioBaixaId = table.Column<Guid>(type: "uuid", nullable: true),
                    DentistaId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ClinicaId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContasPagar", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContasPagar_Dentistas_DentistaId",
                        column: x => x.DentistaId,
                        principalTable: "Dentistas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ItensPlanoTratamento_DentistaId",
                table: "ItensPlanoTratamento",
                column: "DentistaId");

            migrationBuilder.CreateIndex(
                name: "IX_ContasReceber_DentistaId",
                table: "ContasReceber",
                column: "DentistaId");

            migrationBuilder.CreateIndex(
                name: "IX_ContasPagar_ClinicaId_Status_DataVencimento",
                table: "ContasPagar",
                columns: new[] { "ClinicaId", "Status", "DataVencimento" });

            migrationBuilder.CreateIndex(
                name: "IX_ContasPagar_DentistaId",
                table: "ContasPagar",
                column: "DentistaId");

            migrationBuilder.AddForeignKey(
                name: "FK_ContasReceber_Dentistas_DentistaId",
                table: "ContasReceber",
                column: "DentistaId",
                principalTable: "Dentistas",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ItensPlanoTratamento_Dentistas_DentistaId",
                table: "ItensPlanoTratamento",
                column: "DentistaId",
                principalTable: "Dentistas",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ContasReceber_Dentistas_DentistaId",
                table: "ContasReceber");

            migrationBuilder.DropForeignKey(
                name: "FK_ItensPlanoTratamento_Dentistas_DentistaId",
                table: "ItensPlanoTratamento");

            migrationBuilder.DropTable(
                name: "ContasPagar");

            migrationBuilder.DropIndex(
                name: "IX_ItensPlanoTratamento_DentistaId",
                table: "ItensPlanoTratamento");

            migrationBuilder.DropIndex(
                name: "IX_ContasReceber_DentistaId",
                table: "ContasReceber");

            migrationBuilder.DropColumn(
                name: "DentistaId",
                table: "ItensPlanoTratamento");

            migrationBuilder.DropColumn(
                name: "RegraComissaoJson",
                table: "Dentistas");

            migrationBuilder.DropColumn(
                name: "DentistaId",
                table: "ContasReceber");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "ItensPlanoTratamento",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30,
                oldDefaultValue: "Orcado");
        }
    }
}
