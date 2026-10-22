/* ============================================================
 * 问卷原始数据（12 份有效样本）
 * ------------------------------------------------------------
 * 这里是网站唯一的数据源。改这里，图表、百分比、洞察里的
 * 数字会自动重算，不需要动任何页面代码。
 *
 * 新增一份问卷：复制 rows 里的一个大括号块，改 id 和各字段值即可。
 * 选项如果出现新的取值，把对应文字补进 questions[].options，
 * 否则图表按字母序排在最后。
 * ============================================================ */

window.SURVEY = {
  /* 样本与执行说明：只写文档能支撑的事实 */
  meta: {
    method: "线上问卷",
    sample: 12,
    executor: "张钧凯",
    scope: "高校在读学生与初入职场的年轻人",
    note: "共回收 12 份有效问卷，以下所有百分比按 12 人计算，四舍五入到整数。"
  },

  /* 题目定义：field 对应 rows 里的字段名，options 决定图表顺序 */
  questions: [
    {
      key: "Q1",
      field: "role",
      title: "身份",
      type: "single",
      options: ["本科生", "研究生"]
    },
    {
      key: "Q2",
      field: "sleepTime",
      title: "平均入睡时间",
      type: "single",
      ordered: true,
      unit: "时段",
      options: ["23:00-23:30", "23:30-00:00", "00:00-00:30", "00:30-01:00", "01:00-02:00"]
    },
    {
      key: "Q3",
      field: "procrastination",
      title: "是否存在睡眠拖延",
      type: "single",
      ordered: true,
      options: ["是，经常", "偶尔", "几乎没有"]
    },
    {
      key: "Q4",
      field: "screenTime",
      title: "睡前电子设备时长",
      type: "single",
      ordered: true,
      options: ["30 分钟以内", "30-60 分钟", "1 小时以上"]
    },
    {
      key: "Q5",
      field: "devices",
      title: "最常使用设备",
      type: "multi",
      options: ["手机", "平板", "电脑"]
    },
    {
      key: "Q6",
      field: "contents",
      title: "最易推迟睡觉的内容",
      type: "multi",
      options: ["短视频", "短剧", "刷剧", "游戏", "社交聊天", "资讯", "资讯阅读", "文献查阅", "课程作业", "学习资料", "社团消息"],
      groupNote: "多选题：同一人提到多类内容只计一次，按「提到该类的受访者人数」统计。"
    },
    {
      key: "Q7",
      field: "usedTool",
      title: "是否用过睡眠管理工具",
      type: "single",
      options: ["是", "否"]
    },
    {
      key: "Q8",
      field: "feature",
      title: "最在意的 APP 功能",
      type: "single",
      options: ["睡眠数据分析", "睡眠质量监测", "睡前提醒", "白噪音助眠", "作息规律打卡", "强制锁屏功能", "晨起唤醒服务"]
    },
    {
      key: "Q9",
      field: "reminder",
      title: "能接受的提醒方式",
      type: "single",
      ordered: true,
      options: ["强制锁定屏幕", "温和通知提醒", "温和振动提醒", "无提醒，手动打开"]
    },
    {
      key: "Q10",
      field: "privacy",
      title: "数据收集接受度",
      type: "single",
      ordered: true,
      options: ["完全接受", "本地存储可接受", "比较在意隐私", "无所谓"]
    }
  ],

  /* Q6 内容类目的归并（原表用词太碎，图表按类目呈现） */
  groups: {
    Q6: [
      { label: "短视频 / 剧集", members: ["短视频", "短剧", "刷剧", "轻短视频"] },
      { label: "社交聊天", members: ["社交聊天"] },
      { label: "游戏", members: ["游戏"] },
      { label: "资讯 / 阅读", members: ["资讯", "资讯阅读"] },
      { label: "学习 / 工作事务", members: ["文献查阅", "课程作业", "学习资料", "社团消息"] }
    ]
  },

  /* 12 份原始问卷，逐行对应《作业4》表格 */
  rows: [
    { id: 1,  role: "本科生", sleepTime: "00:30-01:00", procrastination: "是，经常", screenTime: "1 小时以上", devices: ["手机", "平板"], contents: ["短视频", "社交聊天"], usedTool: "是", tool: "智能手表", feature: "睡眠数据分析", reminder: "强制锁定屏幕", privacy: "完全接受" },
    { id: 2,  role: "本科生", sleepTime: "23:30-00:00", procrastination: "偶尔", screenTime: "30-60 分钟", devices: ["手机"], contents: ["短剧", "短视频"], usedTool: "否", tool: "", feature: "睡前提醒", reminder: "温和通知提醒", privacy: "比较在意隐私" },
    { id: 3,  role: "研究生", sleepTime: "00:00-00:30", procrastination: "偶尔", screenTime: "30 分钟以内", devices: ["手机", "电脑"], contents: ["文献查阅", "短视频"], usedTool: "是", tool: "睡眠手环", feature: "睡眠质量监测", reminder: "温和通知提醒", privacy: "本地存储可接受" },
    { id: 4,  role: "本科生", sleepTime: "01:00-02:00", procrastination: "是，经常", screenTime: "1 小时以上", devices: ["手机"], contents: ["短视频", "游戏"], usedTool: "否", tool: "", feature: "白噪音助眠", reminder: "无提醒，手动打开", privacy: "完全接受" },
    { id: 5,  role: "本科生", sleepTime: "23:00-23:30", procrastination: "几乎没有", screenTime: "30 分钟以内", devices: ["手机"], contents: ["社交聊天"], usedTool: "是", tool: "手机健康 APP", feature: "作息规律打卡", reminder: "温和通知提醒", privacy: "比较在意隐私" },
    { id: 6,  role: "研究生", sleepTime: "00:30-01:00", procrastination: "偶尔", screenTime: "30-60 分钟", devices: ["手机", "平板"], contents: ["刷剧", "资讯阅读"], usedTool: "是", tool: "白噪音软件", feature: "白噪音助眠", reminder: "温和振动提醒", privacy: "本地存储可接受" },
    { id: 7,  role: "本科生", sleepTime: "01:00-02:00", procrastination: "是，经常", screenTime: "1 小时以上", devices: ["手机"], contents: ["游戏", "社交聊天"], usedTool: "否", tool: "", feature: "强制锁屏功能", reminder: "强制锁定屏幕", privacy: "无所谓" },
    { id: 8,  role: "本科生", sleepTime: "00:00-00:30", procrastination: "偶尔", screenTime: "30-60 分钟", devices: ["手机", "电脑"], contents: ["课程作业", "短视频"], usedTool: "是", tool: "睡眠手环", feature: "睡眠数据分析", reminder: "温和通知提醒", privacy: "比较在意隐私" },
    { id: 9,  role: "本科生", sleepTime: "23:30-00:00", procrastination: "几乎没有", screenTime: "30 分钟以内", devices: ["手机"], contents: ["资讯", "轻短视频"], usedTool: "是", tool: "手机健康 APP", feature: "晨起唤醒服务", reminder: "无提醒，手动打开", privacy: "比较在意隐私" },
    { id: 10, role: "本科生", sleepTime: "00:30-01:00", procrastination: "是，经常", screenTime: "1 小时以上", devices: ["手机", "平板"], contents: ["短视频", "刷剧"], usedTool: "否", tool: "", feature: "睡前提醒", reminder: "温和振动提醒", privacy: "完全接受" },
    { id: 11, role: "本科生", sleepTime: "01:00-02:00", procrastination: "偶尔", screenTime: "30-60 分钟", devices: ["手机"], contents: ["游戏", "社交聊天"], usedTool: "是", tool: "手机屏幕时间管理", feature: "强制锁屏功能", reminder: "强制锁定屏幕", privacy: "无所谓" },
    { id: 12, role: "本科生", sleepTime: "00:00-00:30", procrastination: "偶尔", screenTime: "30 分钟以内", devices: ["手机", "电脑"], contents: ["学习资料", "社团消息"], usedTool: "是", tool: "智能手表", feature: "睡眠质量监测", reminder: "温和通知提醒", privacy: "比较在意隐私" }
  ]
};
