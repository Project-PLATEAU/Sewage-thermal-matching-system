using CsvHelper;
using CsvHelper.Configuration;
using SewerHeatGIS_Web.Models;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace SewerHeatGIS_Web.Logics
{
    /// <summary>
    /// ヒートポンプ計算ロジック
    /// </summary>
    public class HeatPump
    {
        /// <summary>
        /// ヒートポンプ計算用CSVとサイズCSVのデータを元にヒートポンプサイズを特定する。
        /// </summary>
        /// <param name="inputHeatPumpModel"></param>
        /// <param name="rootPath"></param>
        /// <returns></returns>
        public static OutputHeatPumpModel IdentifyHeatPumpSize(InputHeatPumpModel inputHeatPumpModel, string rootPath)
        {
            var result = new OutputHeatPumpModel();

            // CSVの設定
            EncodingProvider provider = System.Text.CodePagesEncodingProvider.Instance;
            Encoding encoding = provider.GetEncoding("shift-jis")!;

            // サイズ(機種)CSVの読み込み
            string sizeCsvPath = Path.Combine(rootPath, Constants.SizeCSVFileName);
            var heatPumpSizes = ReadHeatPumpSizeCsv(sizeCsvPath, encoding);

            // ヒートポンプ計算用CSVの読み込み
            string tableCsvPath = GetTableCsvPath(inputHeatPumpModel, rootPath);
            var heatPump = GetHeatPump(inputHeatPumpModel, tableCsvPath, encoding);
            // 対象機種の判定
            var heatPumpSize = heatPumpSizes.Where(x => x.PumpKey == heatPump.PumpKey).First();

            result.PumpKey = heatPump.PumpKey;
            result.HeatPumps = heatPump.HeatPumps;
            result.Width = heatPumpSize.Width * heatPump.Unit;
            result.Depth = heatPumpSize.Depth;
            result.Hight = heatPumpSize.Hight;
            result.Unit = heatPump.Unit;
            result.HeatDemand = heatPump.HeatDemand;
            result.Potential = heatPump.Potential;
            result.SinglePumpWidth = heatPumpSize.Width;

            return result;
        }

        /// <summary>
        /// パラメータの熱利用種別に合わせて、ヒートポンプ計算用CSVのパスを取得する
        /// </summary>
        /// <param name="inputHeatPumpModel"></param>
        /// <param name="rootPath"></param>
        /// <returns></returns>
        private static string GetTableCsvPath(InputHeatPumpModel inputHeatPumpModel, string rootPath)
        {
            string tableCsvPath = "";
            if (inputHeatPumpModel.HeatType == Constants.HeatTypeKuchou)
            {
                tableCsvPath = Path.Combine(rootPath, Constants.HeaterCSVFileName);
            }
            else if (inputHeatPumpModel.HeatType == Constants.HeatTypeKyutou)
            {
                tableCsvPath = Path.Combine(rootPath, Constants.WaterHeatCSVFileName);
            }
            else
            {
                throw new InvalidDataException("パラメータの熱利用種別が不正です。");
            }


            return tableCsvPath;
        }

        /// <summary>
        /// ヒートポンプ計算用CSVを読み込み、ヒートポンプ計算用データを取得する
        /// </summary>
        /// <param name="inputHeatPumpModel"></param>
        /// <param name="tableCsvPath"></param>
        /// <param name="encoding"></param>
        /// <returns></returns>
        private static HeatPumpTable GetHeatPump(InputHeatPumpModel inputHeatPumpModel, string tableCsvPath, Encoding encoding)
        {
            var result = new HeatPumpTable();

            string feildValue = "";
            List<double> headDemends = new List<double>();
            List<double> potentials = new List<double>();

            using (var reader = new StreamReader(tableCsvPath, encoding))
            using (var csv = new CsvReader(reader, CultureInfo.InvariantCulture))
            {
                csv.Read();
                csv.ReadHeader();

                bool isHeader = true;
                int heatDemandIndex = 0;
                double potentialValue = 0;
                while (csv.Read())
                {
                    if (isHeader) // ヘッダー処理で熱需要値を取得
                    {                        
                        headDemends = GetheadDemends(csv, inputHeatPumpModel);
                        heatDemandIndex = headDemends.Count();
                        isHeader = false;
                    }

                    // ポテンシャル値の取得
                    potentialValue = csv.GetField<double>(0);
                    potentials.Add(potentialValue);
                    feildValue = csv.GetField<string>(heatDemandIndex)!;

                    if (potentialValue >= inputHeatPumpModel.Potential)
                    {
                        // パラメータのポテンシャル値以上のCSVポテンシャルを検出したら以降は対象外
                        break;
                    }
                }
            }

            result = ConvartHeatPumpData(feildValue, headDemends.Last(), potentials.Last());

            return result;
        }

        /// <summary>
        /// CSVの値(特定した熱需要値とポテンシャル値およびフィールド値)をヒートポンプ計算用データに変換する
        /// </summary>
        /// <param name="feildValue">「{ヒートポンプ機種記号}x台数」の文字　(例):AGx2</param>
        /// <param name="heatDemandValue">CSVの熱需要値</param>
        /// <param name="potentialValue">CSVのポテンシャル値</param>
        /// <returns></returns>
        private static HeatPumpTable ConvartHeatPumpData(string feildValue, double heatDemandValue, double potentialValue)
        {
            string[] heatPumpArray = feildValue.Split('x');
            var heatPumpKey = heatPumpArray[0];
            var result = new HeatPumpTable()
            {
                PumpKey = heatPumpKey,
                HeatPumps = feildValue!,
                Potential = potentialValue,
                HeatDemand = heatDemandValue,
            };
            if (heatPumpArray.Length == 2)
            {
                // 台数
                result.Unit = int.Parse(heatPumpArray[1]);
            }

            return result;
        }

        /// <summary>
        /// パラメータの熱需要値より下回るCSVの熱需要リストを取得する
        ///   - CSVの最小値よりパラメータが小さければ、CSV先頭の熱需要値を戻す
        ///   - CSVの最小値よりパラメータが大きければ、CSV全ての熱需要値を戻す
        /// </summary>
        /// <param name="csv"></param>
        /// <param name="inputHeatPumpModel"></param>
        /// <returns></returns>
        private static List<double> GetheadDemends(CsvReader csv, InputHeatPumpModel inputHeatPumpModel)
        {
            List<double> headDemends = new List<double>();

            foreach (var hr in csv.HeaderRecord!)
            {
                if (double.TryParse(hr, out double d))
                {
                    headDemends.Add(d);
                    if (d >= inputHeatPumpModel.HeatDemand)
                    {
                        // パラメータの熱需要値以上のCSV熱需要を検出したら以降は対象外
                        break;
                    }
                }
            }

            return headDemends;
        }

        /// <summary>
        /// サイズ(機種)CSVを読み込む
        /// </summary>
        /// <param name="csvPath"></param>
        /// <param name="encoding"></param>
        /// <returns></returns>
        private static List<HeatPumpSizeCsv> ReadHeatPumpSizeCsv(string csvPath, Encoding encoding)
        {
            using (var reader = new StreamReader(csvPath, encoding))
            using (var csv = new CsvReader(reader, CultureInfo.InvariantCulture))
            {
                var records = csv.GetRecords<HeatPumpSizeCsv>();
                return records.ToList();
            }
        }

    }
}
