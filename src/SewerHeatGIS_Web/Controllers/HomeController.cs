using Microsoft.AspNetCore.Mvc;
using PlateauSewerHeatWeb.Models;
using System.Diagnostics;
using SewerHeatGIS_Web.Models;
using SewerHeatGIS_Web.Logics;
using Microsoft.AspNetCore.Diagnostics;
using System.IO.Compression;

namespace PlateauSewerHeatWeb.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly IHttpClientFactory _httpClientFactory;

        public HomeController(ILogger<HomeController> logger, IConfiguration configuration, IWebHostEnvironment webHostEnvironment, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _webHostEnvironment = webHostEnvironment;
            _httpClientFactory = httpClientFactory;
        }

        public IActionResult Map()
        {
            return View();
        }

        /// <summary>
        /// 検討ツール(Excel)をZip化してダウンロードする。
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        public IActionResult DownloadExcelTool(ExcelToolModel model)
        {
            var storagePath = Path.Combine(_webHostEnvironment.ContentRootPath, "Storage");
            string templatePath = Path.Combine(storagePath, Constants.TEMPLATE_FILE_NAME);

            // 時間超過したフォルダは削除する
            var workBaseDir = Path.Combine(storagePath, "Work");
            DeleteFiles(workBaseDir);

            DateTime now = DateTime.UtcNow.AddHours(9);
            string nowStr = now.ToString("yyyyMMddHHmmss");

            // Workフォルダを作成する
            string outputDir = GenerateOutputDirPath(workBaseDir, nowStr);
            Directory.CreateDirectory(outputDir);

            // Workフォルダに取扱説明書をコピーする
            System.IO.File.Copy(
                Path.Combine(storagePath, Constants.MANUAL_FILE_NAME), 
                Path.Combine(outputDir, Constants.MANUAL_FILE_NAME)
            );

            // Excelファイルに書き込み
            string fileName = $"検討ツール_{nowStr}.xlsm";
            string outputExcelPath = Path.Combine(outputDir, fileName);
            SewerHeatTool.CreateExcelTool(templatePath, outputExcelPath, model);
            DateTimeKind timeKind = DateTime.Now.Kind;            
            if (now > DateTime.Now)
            {
                // ファイルの作成日時と更新日時を日本時間に変更する
                UpdateFileTimes(outputExcelPath, now);
            }

            // zipファイルを作成する
            string zipPath = outputDir + ".zip";
            string downloadZipFileName = $"検討ツール_{nowStr}.zip";
            ZipFile.CreateFromDirectory(outputDir, zipPath);
            if (now > DateTime.Now)
            {
                // ファイルの作成日時と更新日時を日本時間に変更する
                UpdateFileTimes(zipPath, now);
            }

            // 作成したzipをダウンロードさせる。
            string contentType = "application/zip";
            return PhysicalFile(zipPath, contentType, downloadZipFileName);
        }

        [HttpPost]
        public async Task<IActionResult> DownloadPdfTool([FromForm]ReportModel reportModel) 
        {
            var contentRootPath = _webHostEnvironment.ContentRootPath;
            try
            {
                byte[] result = await SewerHeatReport.CreateReportFile(_httpClientFactory, contentRootPath, reportModel);
                string nowStr = DateTime.UtcNow.AddHours(9).ToString("yyyyMMddHHmmss");
                string downloadFileName = $"調書_{nowStr}.pdf";
                return File(result, "application/pdf", downloadFileName);
            }
            catch (Exception ex) 
            {
                _logger.LogError(ex.ToString());
                if (ex.InnerException != null)
                {
                    _logger.LogError(ex.InnerException.ToString());
                }
                return StatusCode(500);
            }
        }

        public IActionResult GetHeatPumpSize(InputHeatPumpModel inputHeatPumpModel)
        {
            var storagePath = Path.Combine(_webHostEnvironment.ContentRootPath, "Storage");
            var heatPumpSize = HeatPump.IdentifyHeatPumpSize(inputHeatPumpModel, storagePath);
            object result = new { status = "OK", data = heatPumpSize };
            return Ok(result);
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }


        /// <summary>
        /// ファイルの作成日時と更新日時を変更する
        /// </summary>
        private void UpdateFileTimes(string filePath, DateTime now)
        {
            var fileInfo = new FileInfo(filePath);
            fileInfo.CreationTimeUtc = now;
            fileInfo.LastWriteTimeUtc = now;
        }

        /// <summary>
        /// 不要となったファイルを削除する
        /// </summary>
        /// <param name="workDir"></param>
        private void DeleteFiles(string workDir)
        {
            if (!Directory.Exists(workDir))
            {
                return;
            }

            string[] dirs = Directory.GetDirectories(workDir);
            foreach (string dir in dirs)
            {
                FileAttributes fas = System.IO.File.GetAttributes(dir);
                if ((fas & FileAttributes.ReadOnly) == FileAttributes.ReadOnly)
                {
                    //読み取り専用フォルダは削除しない
                    continue;
                }

                DateTime lastdt = Directory.GetLastWriteTime(dir);
                if (lastdt >= DateTime.Now.AddMinutes(-20))
                {
                    continue;
                }

                try
                {
                    Directory.Delete(dir, true);
                }
                catch
                {
                    //削除失敗しても何もしない
                }
            }
        }

        private string GenerateOutputDirPath(string workBaseDir, string nowStr)
        {
            Guid g = Guid.NewGuid();
            string outputBaseDir = Path.Combine(workBaseDir, g.ToString());
            string outputDirPath = Path.Combine(outputBaseDir, $"検討ツール_{nowStr}");
            return outputDirPath;
        }
    }
}