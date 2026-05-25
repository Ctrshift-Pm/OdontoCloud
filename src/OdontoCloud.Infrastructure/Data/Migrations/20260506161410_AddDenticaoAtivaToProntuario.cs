using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdontoCloud.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDenticaoAtivaToProntuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DenticaoAtiva",
                table: "Prontuarios",
                type: "integer",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DenticaoAtiva",
                table: "Prontuarios");
        }
    }
}
