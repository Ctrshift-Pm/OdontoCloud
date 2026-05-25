using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdontoCloud.Infrastructure.Data.Migrations;

[DbContext(typeof(OdontoCloudDbContext))]
[Migration("20260504090000_AddAgendaConfigToDentistas")]
public partial class AddAgendaConfigToDentistas : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "AgendaConfigJson",
            table: "Dentistas",
            type: "jsonb",
            nullable: false,
            defaultValue: """{"inicio":"08:00","fim":"18:00","duracaoPadraoMinutos":30,"diasDaSemana":[0,1,2,3,4,5,6]}""");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "AgendaConfigJson",
            table: "Dentistas");
    }
}
