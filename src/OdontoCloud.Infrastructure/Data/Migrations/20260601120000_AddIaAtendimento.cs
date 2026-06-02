using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdontoCloud.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(OdontoCloudDbContext))]
    [Migration("20260601120000_AddIaAtendimento")]
    public partial class AddIaAtendimento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IaLeads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TelefoneWhatsapp = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    MotivoContato = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    ResumoInteracao = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Urgencia = table.Column<int>(type: "integer", nullable: false),
                    ProcedimentoInteresse = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Sentimento = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    ProximoFollowUpEm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    AtendimentoAssumido = table.Column<bool>(type: "boolean", nullable: false),
                    ClinicaId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IaLeads", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IaMensagens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IaLeadId = table.Column<Guid>(type: "uuid", nullable: false),
                    Direcao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Conteudo = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    EnviadaEmUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Canal = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ClinicaId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IaMensagens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IaMensagens_IaLeads_IaLeadId",
                        column: x => x.IaLeadId,
                        principalTable: "IaLeads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IaLeads_ClinicaId_Status_Urgencia",
                table: "IaLeads",
                columns: new[] { "ClinicaId", "Status", "Urgencia" });

            migrationBuilder.CreateIndex(
                name: "IX_IaLeads_ClinicaId_TelefoneWhatsapp",
                table: "IaLeads",
                columns: new[] { "ClinicaId", "TelefoneWhatsapp" });

            migrationBuilder.CreateIndex(
                name: "IX_IaMensagens_ClinicaId_IaLeadId_EnviadaEmUtc",
                table: "IaMensagens",
                columns: new[] { "ClinicaId", "IaLeadId", "EnviadaEmUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_IaMensagens_IaLeadId",
                table: "IaMensagens",
                column: "IaLeadId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IaMensagens");

            migrationBuilder.DropTable(
                name: "IaLeads");
        }
    }
}
