using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdontoCloud.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanoTratamentoStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "NumeroDente",
                table: "ItensPlanoTratamento",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "ItensPlanoTratamento",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Orcado");

            migrationBuilder.Sql("""
                UPDATE "ItensPlanoTratamento"
                SET "Status" = 'Orcado'
                WHERE "Status" = '';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NumeroDente",
                table: "ItensPlanoTratamento");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "ItensPlanoTratamento");
        }
    }
}
