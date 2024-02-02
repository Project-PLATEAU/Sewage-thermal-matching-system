using iTextSharp.text;
using iTextSharp.text.pdf;
using SewerHeatGIS_Web.Models;

namespace SewerHeatGIS_Web.Logics
{
    /// <summary>
    /// 下水熱利用調書を作成する
    /// </summary>
    public class SewerHeatReport
    {

        /// <summary>
        /// 
        /// </summary>
        /// <param name="httpClientFactory"></param>
        /// <param name="rootPath"></param>
        /// <param name="model"></param>
        /// <returns></returns>
        public async static Task<byte[]> CreateReportFile(IHttpClientFactory httpClientFactory, string rootPath, ReportModel model)
        {
            Dictionary<string, double[]> imageInfo = new Dictionary<string, double[]>()
            {
                {"background" ,new double[]{0,0,690,506.25}},
                {"legend" ,new double[]{570.3452,415.0001,88.9048,58.74992}},
                {"compass" ,new double[]{610.4231,230.9616,48.07732,44.37488}},
            };

            Dictionary<string, double[]> positionInfo = new Dictionary<string, double[]>() {
                {"下水熱利用調書" ,new double[]{0.033696,0.038519,0.21087,0.072593}},
                {"出力日" ,new double[]{0.575,0.074074,0.190217,0.037037}},
                {"{出力日}" ,new double[]{0.765217,0.074074,0.204348,0.037037}},
                {"熱利用用途" ,new double[]{0.033696,0.111111,0.23087,0.037037}},
                {"{熱利用用途}" ,new double[]{0.264565,0.111111,0.222391,0.037037}},
                {"管渠属性" ,new double[]{0.575,0.111111,0.394565,0.037037}},
                {"ヒートポンプサイズ" ,new double[]{0.033696,0.148148,0.23087,0.037037}},
                {"{ヒートポンプサイズ}" ,new double[]{0.264565,0.148148,0.222391,0.037037}},
                {"管渠属性ID" ,new double[]{0.575,0.148148,0.190217,0.037037}},
                {"{管渠属性ID}" ,new double[]{0.765217,0.148148,0.204348,0.037037}},
                {"管径（mm）" ,new double[]{0.575,0.185185,0.190217,0.037037}},
                {"{管径（mm）}" ,new double[]{0.765217,0.185185,0.204348,0.037037}},
                {"建物属性" ,new double[]{0.033696,0.222222,0.453261,0.037037}},
                {"管渠延長（ｍ）" ,new double[]{0.575,0.222222,0.190217,0.037037}},
                {"{管渠延長（ｍ）}" ,new double[]{0.765217,0.222222,0.204348,0.037037}},
                {"建物属性ID" ,new double[]{0.033696,0.259259,0.23087,0.037037}},
                {"{建物属性ID}" ,new double[]{0.264565,0.259259,0.222391,0.037037}},
                {"熱賦存量（夏）" ,new double[]{0.575,0.259259,0.190217,0.037037}},
                {"{熱賦存量（夏）}" ,new double[]{0.765217,0.259259,0.204348,0.037037}},
                {"建物用途" ,new double[]{0.033696,0.296296,0.23087,0.037037}},
                {"{建物用途}" ,new double[]{0.264565,0.296296,0.222391,0.037037}},
                {"熱賦存量（冬）" ,new double[]{0.575,0.296296,0.190217,0.037037}},
                {"{熱賦存量（冬）}" ,new double[]{0.765217,0.296296,0.204348,0.037037}},
                {"延床面積" ,new double[]{0.033696,0.333333,0.23087,0.037037}},
                {"{延床面積}" ,new double[]{0.264565,0.333333,0.222391,0.037037}},
                {"熱賦存量（年間）" ,new double[]{0.575,0.333333,0.190217,0.037037}},
                {"{熱賦存量（年間）}" ,new double[]{0.765217,0.333333,0.204348,0.037037}},
                {"熱需要値" ,new double[]{0.033696,0.37037,0.23087,0.037037}},
                {"{熱需要値}" ,new double[]{0.264565,0.37037,0.222391,0.037037}},
                {"施工年度" ,new double[]{0.575,0.37037,0.190217,0.037037}},
                {"{施工年度}" ,new double[]{0.765217,0.37037,0.204348,0.037037}},
                {"{地図}" ,new double[]{0.033696,0.444444,0.93587,0.518519}},
            };

            MemoryStream pdfStream = new MemoryStream();

            iTextSharp.text.Document document = new iTextSharp.text.Document(PageSize.A4.Rotate());
            var writer = PdfWriter.GetInstance(document, pdfStream);
            float width = Utilities.MillimetersToPoints(297);
            float height = Utilities.MillimetersToPoints(210);
            float margin = Utilities.MillimetersToPoints(15);
            writer.SetPageSize(new Rectangle(width, height));
            document.Open();

            // フォントの準備
            var font = BaseFont.CreateFont(Path.Combine(rootPath, "fonts", "IBM_Plex_Sans_JP", "IBMPlexSansJP-Light.ttf"), BaseFont.IDENTITY_H, BaseFont.EMBEDDED);

            var fontBold = BaseFont.CreateFont(Path.Combine(rootPath, "fonts", "IBM_Plex_Sans_JP", "IBMPlexSansJP-SemiBold.ttf"), BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            // フォント設定

            var pdfContentByte = writer.DirectContent;


            var httpClient = httpClientFactory.CreateClient();
            var imageData = await httpClient.GetByteArrayAsync(model.Url);

            DrawImage("{地図}", imageData, pdfContentByte, positionInfo);

            float absWidth = Utilities.MillimetersToPoints(297);
            float absHeight = Utilities.MillimetersToPoints(210);

            using (Stream inputImageStream = new FileStream(Path.Combine(rootPath, "images", "legend.png"), FileMode.Open))
            {

                iTextSharp.text.Image image = iTextSharp.text.Image.GetInstance(inputImageStream);

                float legendWidth = absWidth * (float)imageInfo["legend"][2] / (float)imageInfo["background"][2];
                float ratio = legendWidth / image.Width ;
                float legendHeight = image.Height * ratio;

                float x = absWidth * (float)imageInfo["legend"][0] / (float)imageInfo["background"][2];
                float y = absHeight * (1.0f - ((float)imageInfo["legend"][1] / (float)imageInfo["background"][3])) - legendHeight;
                image.ScaleAbsolute(legendWidth, legendHeight);
                image.SetAbsolutePosition(x, y);
                pdfContentByte.AddImage(image);
            }


            using (Stream inputImageStream = new FileStream(Path.Combine(rootPath, "images", "compass.png"), FileMode.Open))
            {

                iTextSharp.text.Image image = iTextSharp.text.Image.GetInstance(inputImageStream);

                float compassWidth = absWidth * (float)imageInfo["compass"][2] / (float)imageInfo["background"][2];
                float ratio = compassWidth / image.Width;
                float compassHeight = image.Height * ratio;

                float x = absWidth * (float)imageInfo["compass"][0] / (float)imageInfo["background"][2];
                float y = absHeight * (1.0f - ((float)imageInfo["compass"][1] / (float)imageInfo["background"][3])) - compassHeight;
                image.ScaleAbsolute(compassWidth, compassHeight);
                image.SetAbsolutePosition(x, y);
                pdfContentByte.AddImage(image);
            }


            DrawCell("下水熱利用調書", "下水熱利用調書", pdfContentByte, positionInfo, fontBold, PdfContentByte.ALIGN_LEFT,15, true);

            DrawCell("出力日", "出力日", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_LEFT,10, true);
            DrawCell("{出力日}", DateTime.UtcNow.AddHours(9).ToString("yyyy/MM/dd"), pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_RIGHT, 10, true);

            DrawCell("熱利用用途", "熱利用用途", pdfContentByte,positionInfo,font, PdfContentByte.ALIGN_LEFT);
            DrawCell("{熱利用用途}", SewerHeatTool.GetHeatUsage(model.HeatType), pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_RIGHT);

            DrawCell("ヒートポンプサイズ", "ヒートポンプサイズ 幅*奥行*高さ（mm）", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_LEFT);
            DrawCell("{ヒートポンプサイズ}", model.BuildingHeatPumpSize, pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_RIGHT);

            DrawCell("建物属性", "建物属性", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_CENTER);

            DrawCell("建物属性ID", "ID", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_LEFT);
            DrawCell("{建物属性ID}", model.BuildingID, pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_RIGHT);

            DrawCell("建物用途", "建物用途", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_LEFT);
            DrawCell("{建物用途}", model.BuildingYouto, pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_RIGHT);

            DrawCell("延床面積", "延床面積（m2）", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_LEFT);
            DrawCell("{延床面積}", model.BuildingNobeyuka, pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_RIGHT);

            DrawCell("熱需要値", "熱需要値（MJ/年）", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_LEFT);
            DrawCell("{熱需要値}", model.BuildingReHeatDemand, pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_RIGHT);

            DrawCell("管渠属性", "管渠属性", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_CENTER);

            DrawCell("管渠属性ID", "ID", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_LEFT);
            DrawCell("{管渠属性ID}", model.PipeID, pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_RIGHT);

            DrawCell("管径（mm）", "管径（mm）", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_LEFT);
            DrawCell("{管径（mm）}", model.PipeDiameter, pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_RIGHT);

            DrawCell("管渠延長（ｍ）", "管渠延長（ｍ）", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_LEFT);
            DrawCell("{管渠延長（ｍ）}", model.PipeSecDist, pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_RIGHT);

            DrawCell("熱賦存量（夏）", "熱賦存量（夏）", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_LEFT);
            DrawCell("{熱賦存量（夏）}", model.PipePotentialS, pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_RIGHT);

            DrawCell("熱賦存量（冬）", "熱賦存量（冬）", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_LEFT);
            DrawCell("{熱賦存量（冬）}", model.PipePotentialW, pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_RIGHT);

            DrawCell("熱賦存量（年間）", "熱賦存量（年間）", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_LEFT);
            DrawCell("{熱賦存量（年間）}", model.PipePotentialY, pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_RIGHT);

            DrawCell("施工年度", "施工年度", pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_LEFT);
            DrawCell("{施工年度}", model.PipeConstYear, pdfContentByte, positionInfo, font, PdfContentByte.ALIGN_RIGHT);

            document.Close();
            return pdfStream.ToArray();
        }

        private static void DrawImage(string label, byte[] imageData, PdfContentByte pdfContentByte, Dictionary<string, double[]> positionInfo)
        {
            float absWidth = Utilities.MillimetersToPoints(297);
            float absHeight = Utilities.MillimetersToPoints(210);

            double[] position = positionInfo[label];

            float left = (float)position[0] * absWidth;
            float top = (1.0f - (float)position[1]) * absHeight;
            float width = (float)position[2] * absWidth;
            float height = (float)position[3] * absHeight;

            using (Stream inputImageStream = new MemoryStream(imageData))
            {

                iTextSharp.text.Image image = iTextSharp.text.Image.GetInstance(inputImageStream);
                image.ScaleAbsolute(width, height);
                image.SetAbsolutePosition(left, top - height);
                pdfContentByte.AddImage(image);
            }


        }

        private static void DrawCell(string label,string? value,PdfContentByte pdfContentByte, Dictionary<string, double[]> positionInfo,BaseFont font, int align, int fontSize = 10, bool noBorder = false)
        {
            float absWidth = Utilities.MillimetersToPoints(297);
            float absHeight = Utilities.MillimetersToPoints(210);

            double[] position = positionInfo[label];

            float left = (float)position[0] * absWidth;
            float top = (1.0f - (float)position[1]) * absHeight;
            float width = (float)position[2] * absWidth;
            float height = (float)position[3] * absHeight;

            if (!noBorder) 
            {
                pdfContentByte.SetLineWidth(1.0f);

                pdfContentByte.MoveTo(left, top);
                pdfContentByte.LineTo(left, top - height);
                pdfContentByte.LineTo(left + width, top - height);
                pdfContentByte.LineTo(left + width, top);
                pdfContentByte.LineTo(left, top);
                pdfContentByte.Stroke();
            }

            if (value != null) 
            {
                pdfContentByte.BeginText();
                pdfContentByte.SetFontAndSize(font, fontSize);
                float margin = align == PdfContentByte.ALIGN_RIGHT ? width - Utilities.MillimetersToPoints(2) : align == PdfContentByte.ALIGN_CENTER ? width / 2 : Utilities.MillimetersToPoints(2);
                pdfContentByte.ShowTextAligned(align, value, left + margin, top - (height * 0.6f), 0);
                pdfContentByte.EndText();
            }
        }


        private void DrawTable(PdfContentByte pdfContentByte,float left,float top,float[] cols, float rowHeight, float rowCount) 
        {
            float tableWidth = cols.Sum();
            pdfContentByte.SetLineWidth(2.0f);   // Make a bit thicker than 1.0 default
            // 横の線を描画
            for (int y = 0; y <= rowCount + 1; y++) 
            {
                pdfContentByte.MoveTo(left, top + y * rowHeight);
                pdfContentByte.LineTo(left + tableWidth, top + y * rowHeight);
                pdfContentByte.Stroke();
            }

            // 縦の線を描画
            pdfContentByte.MoveTo(left, top);
            pdfContentByte.LineTo(left, top + rowCount * rowHeight);
            pdfContentByte.Stroke();

            float xPos = left;
            for (int x = 0; x < cols.Length; x++)
            {
                xPos += cols[x];
                pdfContentByte.MoveTo(xPos, top);
                pdfContentByte.LineTo(xPos, top + rowCount * rowHeight);
                pdfContentByte.Stroke();
            }
        }
    }
}
