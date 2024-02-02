using CsvHelper.Configuration.Attributes;

namespace SewerHeatGIS_Web.Models
{
    public class InputHeatPumpModel
    {
        /// <summary>
        /// 熱利用種別(3:空調, 4:給湯)
        /// </summary>
        public int HeatType { get; set; }
        /// <summary>
        /// 熱需要量
        /// </summary>
        public double HeatDemand { get; set; }
        /// <summary>
        /// ポテンシャル値
        /// </summary>
        public double Potential { get; set; }
    }

    public class OutputHeatPumpModel
    {
        /// <summary>
        /// 機種記号
        /// </summary>
        public string PumpKey { get; set; } = "";
        /// <summary>
        /// ヒートポンプ名(機種*台数)
        /// </summary>
        public string HeatPumps { get; set; } = "";        
        /// <summary>
        /// 幅
        /// </summary>
        public int Width { get; set; }
        /// <summary>
        /// 奥行
        /// </summary>
        public int Depth { get; set; }
        /// <summary>
        /// 高さ
        /// </summary>
        public int Hight { get; set; }
        /// <summary>
        /// 機種の台数
        /// </summary>
        public int Unit { get; set; }
        /// <summary>
        /// (CSVの)熱需要量
        /// </summary>
        public double HeatDemand { get; set; }
        /// <summary>
        /// (CSVの)ポテンシャル値
        /// </summary>
        public double Potential { get; set; }
        /// <summary>
        /// 幅(1台あたりの幅)
        /// </summary>
        public int SinglePumpWidth { get; set; }

    }

    /// <summary>
    /// ヒートポンプ計算用データ
    /// </summary>
    public class HeatPumpTable
    {
        /// <summary>
        /// 機種記号
        /// </summary>
        public string PumpKey { get; set; } = "";
        /// <summary>
        /// ヒートポンプ名(機種*台数)
        /// </summary>
        public string HeatPumps { get; set; } = "";
        /// <summary>
        /// 機種の台数
        /// </summary>
        public int Unit { get; set; } = 1;
        /// <summary>
        /// 熱需要量
        /// </summary>
        public double HeatDemand { get; set; }
        /// <summary>
        /// ポテンシャル値
        /// </summary>
        public double Potential { get; set; }
    }

    /// <summary>
    /// ヒートポンプのサイズ表(機種)
    /// </summary>
    public class HeatPumpSizeCsv
    {
        /// <summary>
        /// 機種記号
        /// </summary>
        [Name("機種記号")]
        public string PumpKey { get; set; } = "";
        /// <summary>
        /// 機種名
        /// </summary>
        [Name("機種名")]
        public string Name { get; set; } = "";
        /// <summary>
        /// 幅
        /// </summary>
        [Name("幅")]
        public int Width { get; set; }
        /// <summary>
        /// 奥行
        /// </summary>
        [Name("奥行")]
        public int Depth { get; set; }
        /// <summary>
        /// 高さ
        /// </summary>
        [Name("高さ")]
        public int Hight { get; set; }
    }
}
