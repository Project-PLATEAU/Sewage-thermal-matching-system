using OfficeOpenXml;
using SewerHeatGIS_Web.Models;

namespace SewerHeatGIS_Web.Logics
{
    public class SewerHeatTool
    {
        /// <summary>
        /// Excelを書き換える
        /// </summary>
        /// <param name="templatePath"></param>
        /// <param name="outputExcelPath"></param>
        /// <param name="model"></param>
        /// <returns></returns>
        public static void CreateExcelTool(string templatePath,string outputExcelPath, ExcelToolModel model)
        {
            using (var package = new ExcelPackage(templatePath))
            {
                package.Workbook.Worksheets["入力シート"].Cells["C7"].Value = model.Chiki;
                package.Workbook.Worksheets["入力シート"].Cells["C8"].Value = GetHeatUsage(model.HeatType);
                package.Workbook.Worksheets["入力シート"].Cells["C9"].Value = model.Youto;
                package.Workbook.Worksheets["入力シート"].Cells["C10"].Value = model.Nobeyuka;
                package.Workbook.Worksheets["入力シート"].Cells["C47"].Value = model.PotentialY;
                package.Workbook.Worksheets["入力シート"].Cells["C57"].Value = model.PipeLength;
                package.Workbook.Worksheets["入力シート"].Cells["C68"].Value = Constants.EXCEL_ENERGY_TYPE;
                package.Workbook.Worksheets["入力シート"].Cells["C77"].Value = Constants.EXCEL_PANEL_FOOTPRINT;
                package.Workbook.Worksheets["入力シート"].Cells["C127"].Value = Constants.EXCEL_SUBSIDIES;
                package.Workbook.Worksheets["入力シート"].Cells["C128"].Value = Constants.EXCEL_SUBSIDIES_RATE;

                var newFile = new FileInfo(outputExcelPath);
                package.SaveAs(newFile);
            }
        }

        /// <summary>
        /// 熱利用用途の表示名称に変換する
        /// </summary>
        /// <returns></returns>
        public static string GetHeatUsage(int heatType)
        {
            string usage = "";
            switch (heatType)
            {
                case Constants.HeatTypeKuchou:
                    usage = Constants.HeatUsageKuchou;
                    break;

                case Constants.HeatTypeKyutou:
                    usage = Constants.HeatUsageKyutou;
                    break;
            }

            return usage;
        }
    }
}
