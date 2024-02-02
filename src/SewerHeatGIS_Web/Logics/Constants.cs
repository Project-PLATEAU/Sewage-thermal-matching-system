namespace SewerHeatGIS_Web.Logics
{
    /// <summary>
    /// 定数
    /// </summary>
    public class Constants
    {
        /// <summary>
        /// 熱利用用途(空調)
        /// </summary>
        public const int HeatTypeKuchou = 3;
        /// <summary>
        /// 熱利用用途(給湯)
        /// </summary>
        public const int HeatTypeKyutou = 4;

        /// <summary>
        /// 熱利用用途(空調)
        /// </summary>
        public const string HeatUsageKuchou = "空調";
        /// <summary>
        /// 熱利用用途(給湯)
        /// </summary>
        public const string HeatUsageKyutou = "給湯";


        /// <summary>
        /// 対象エネルギーの種別(C68)
        /// </summary>
        public const string EXCEL_ENERGY_TYPE = "利用しない";
        /// <summary>
        /// 設置面積(C77)
        /// </summary>
        public const string EXCEL_PANEL_FOOTPRINT = "";
        /// <summary>
        /// 補助金の利用(C127)
        /// </summary>
        public const string EXCEL_SUBSIDIES = "無し";
        /// <summary>
        /// 補助率(C128)
        /// </summary>
        public const string EXCEL_SUBSIDIES_RATE = "";


        /// <summary>
        /// Excelのテンプレートファイル名
        /// </summary>
        public const string TEMPLATE_FILE_NAME = "001401606.xlsm";
        /// <summary>
        /// 取扱説明書のファイル名
        /// </summary>
        public const string MANUAL_FILE_NAME = "取扱説明書.pdf";
        /// <summary>
        /// サイズ(機種)CSVのファイル名
        /// </summary>
        public const string SizeCSVFileName = "ヒートポンプ_機種サイズ.csv";
        /// <summary>
        /// 空調ヒートポンプ計算用CSVのファイル名
        /// </summary>
        public const string HeaterCSVFileName = "ヒートポンプ_暖房運転.csv";
        /// <summary>
        /// 給湯ヒートポンプ計算用CSVのファイル名
        /// </summary>
        public const string WaterHeatCSVFileName = "ヒートポンプ_循環給湯運転.csv";

    }
}
