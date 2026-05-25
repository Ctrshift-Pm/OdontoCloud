using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdontoCloud.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCrmKanbanStatusToPaciente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CrmKanbanStatus",
                table: "Pacientes",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Novo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CrmKanbanStatus",
                table: "Pacientes");
        }
    }
}
