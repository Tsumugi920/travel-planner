/**
 * 内置示例数据：3 个行程，各含日程安排、预算条目与打包清单。
 * 仅在 server/data.json 不存在（或损坏）时用于初始化。
 */
function seedData() {
  const createdAt = '2026-10-01T08:00:00.000Z';
  return {
    trips: [
      {
        id: 'trip_tokyo',
        name: '东京五日游',
        destination: '日本 · 东京',
        startDate: '2026-11-10',
        endDate: '2026-11-14',
        createdAt,
        schedule: [
          { id: 'sc_tokyo_01', day: 1, time: '15:30', title: '抵达羽田机场，入住新宿酒店', type: '交通', note: '京急线转 JR 山手线', createdAt },
          { id: 'sc_tokyo_02', day: 1, time: '18:00', title: '新宿思出横丁晚餐', type: '美食', note: '试试烤串小店', createdAt },
          { id: 'sc_tokyo_03', day: 2, time: '09:00', title: '浅草寺 & 仲见世商店街', type: '景点', note: '早点出发避开人流', createdAt },
          { id: 'sc_tokyo_04', day: 2, time: '14:00', title: '东京晴空塔观景', type: '景点', note: '提前网上购票', createdAt },
          { id: 'sc_tokyo_05', day: 3, time: '10:00', title: 'teamLab 数字艺术馆', type: '活动', note: '丰洲馆，预约上午场', createdAt },
          { id: 'sc_tokyo_06', day: 3, time: '16:00', title: '台场海滨公园散步', type: '景点', note: '', createdAt },
          { id: 'sc_tokyo_07', day: 4, time: '09:30', title: '明治神宫 → 原宿竹下通', type: '景点', note: '', createdAt },
          { id: 'sc_tokyo_08', day: 4, time: '19:00', title: '涩谷十字路口 & Shibuya Sky 看夜景', type: '活动', note: '日落前 1 小时上去最佳', createdAt },
          { id: 'sc_tokyo_09', day: 5, time: '11:00', title: '银座购物，前往机场返程', type: '购物', note: '预留至少 3 小时去机场', createdAt }
        ],
        budget: [
          { id: 'bd_tokyo_01', category: '交通', amount: 3200, note: '往返机票', createdAt },
          { id: 'bd_tokyo_02', category: '住宿', amount: 3600, note: '新宿酒店 4 晚', createdAt },
          { id: 'bd_tokyo_03', category: '餐饮', amount: 1500, note: '含一餐寿司大', createdAt },
          { id: 'bd_tokyo_04', category: '门票', amount: 640, note: '晴空塔 + teamLab + Shibuya Sky', createdAt },
          { id: 'bd_tokyo_05', category: '购物', amount: 2000, note: '伴手礼预算', createdAt },
          { id: 'bd_tokyo_06', category: '其他', amount: 300, note: '电话卡 & 旅游保险', createdAt }
        ],
        packing: [
          { id: 'pk_tokyo_01', name: '护照 & 签证', checked: true },
          { id: 'pk_tokyo_02', name: 'Suica 交通卡', checked: false },
          { id: 'pk_tokyo_03', name: '转换插头', checked: false },
          { id: 'pk_tokyo_04', name: '保温杯', checked: true },
          { id: 'pk_tokyo_05', name: '常用药品', checked: false },
          { id: 'pk_tokyo_06', name: '羽绒服', checked: false },
          { id: 'pk_tokyo_07', name: '充电宝', checked: true }
        ]
      },
      {
        id: 'trip_chengdu',
        name: '成都美食周末',
        destination: '中国 · 成都',
        startDate: '2026-12-05',
        endDate: '2026-12-07',
        createdAt,
        schedule: [
          { id: 'sc_cd_01', day: 1, time: '13:30', title: '抵达成都东站，地铁前往酒店', type: '交通', note: '住春熙路商圈', createdAt },
          { id: 'sc_cd_02', day: 1, time: '16:00', title: '武侯祠 & 锦里古街', type: '景点', note: '晚上灯牌很好看', createdAt },
          { id: 'sc_cd_03', day: 1, time: '18:30', title: '锦里小吃晚餐', type: '美食', note: '三大炮、糖油果子', createdAt },
          { id: 'sc_cd_04', day: 2, time: '08:30', title: '大熊猫繁育研究基地', type: '景点', note: '一定赶早，熊猫最活跃', createdAt },
          { id: 'sc_cd_05', day: 2, time: '13:00', title: '宽窄巷子午餐', type: '美食', note: '', createdAt },
          { id: 'sc_cd_06', day: 2, time: '15:30', title: '人民公园鹤鸣茶社喝茶采耳', type: '活动', note: '盖碗茶约 20 元', createdAt },
          { id: 'sc_cd_07', day: 2, time: '18:30', title: '老码头火锅', type: '美食', note: '热门店，提前取号', createdAt },
          { id: 'sc_cd_08', day: 3, time: '10:00', title: '杜甫草堂', type: '景点', note: '', createdAt },
          { id: 'sc_cd_09', day: 3, time: '14:00', title: '返程', type: '交通', note: '', createdAt }
        ],
        budget: [
          { id: 'bd_cd_01', category: '交通', amount: 1200, note: '高铁往返', createdAt },
          { id: 'bd_cd_02', category: '住宿', amount: 900, note: '春熙路酒店 2 晚', createdAt },
          { id: 'bd_cd_03', category: '餐饮', amount: 800, note: '火锅 + 小吃', createdAt },
          { id: 'bd_cd_04', category: '门票', amount: 130, note: '熊猫基地 + 杜甫草堂 + 武侯祠', createdAt },
          { id: 'bd_cd_05', category: '其他', amount: 200, note: '伴手礼机动', createdAt }
        ],
        packing: [
          { id: 'pk_cd_01', name: '身份证', checked: true },
          { id: 'pk_cd_02', name: '充电宝', checked: true },
          { id: 'pk_cd_03', name: '雨伞', checked: false },
          { id: 'pk_cd_04', name: '肠胃药', checked: false },
          { id: 'pk_cd_05', name: '保温杯', checked: false },
          { id: 'pk_cd_06', name: '相机', checked: false }
        ]
      },
      {
        id: 'trip_bali',
        name: '巴厘岛海岛度假',
        destination: '印度尼西亚 · 巴厘岛',
        startDate: '2027-01-18',
        endDate: '2027-01-24',
        createdAt,
        schedule: [
          { id: 'sc_bali_01', day: 1, time: '14:00', title: '抵达登巴萨机场，前往乌布', type: '交通', note: '落地签排队约 40 分钟', createdAt },
          { id: 'sc_bali_02', day: 1, time: '18:00', title: '乌布皇宫晚餐 & 传统舞表演', type: '活动', note: '', createdAt },
          { id: 'sc_bali_03', day: 2, time: '09:00', title: '德格拉朗梯田', type: '景点', note: '', createdAt },
          { id: 'sc_bali_04', day: 2, time: '14:00', title: '圣猴森林公园', type: '景点', note: '看好墨镜和手机', createdAt },
          { id: 'sc_bali_05', day: 3, time: '08:00', title: '蓝梦岛跳岛一日游（浮潜）', type: '活动', note: '含快艇往返', createdAt },
          { id: 'sc_bali_06', day: 3, time: '17:00', title: '金巴兰海滩日落海鲜烧烤', type: '美食', note: '', createdAt },
          { id: 'sc_bali_07', day: 4, time: '10:00', title: '水明漾沙滩俱乐部', type: '活动', note: '', createdAt },
          { id: 'sc_bali_08', day: 4, time: '16:00', title: '巴厘岛式 SPA 按摩', type: '活动', note: '', createdAt },
          { id: 'sc_bali_09', day: 5, time: '09:30', title: '乌鲁瓦图断崖 & 克恰克舞', type: '景点', note: '傍晚演出', createdAt },
          { id: 'sc_bali_10', day: 6, time: '11:00', title: '库塔海滩冲浪课', type: '活动', note: '', createdAt },
          { id: 'sc_bali_11', day: 7, time: '10:00', title: '采购伴手礼，前往机场', type: '购物', note: '提前 3 小时出发', createdAt }
        ],
        budget: [
          { id: 'bd_bali_01', category: '交通', amount: 4500, note: '往返机票', createdAt },
          { id: 'bd_bali_02', category: '住宿', amount: 4200, note: '乌布 + 金巴兰共 6 晚', createdAt },
          { id: 'bd_bali_03', category: '餐饮', amount: 1800, note: '', createdAt },
          { id: 'bd_bali_04', category: '活动', amount: 1500, note: '蓝梦岛一日游 + SPA + 冲浪课', createdAt },
          { id: 'bd_bali_05', category: '购物', amount: 800, note: '伴手礼', createdAt },
          { id: 'bd_bali_06', category: '其他', amount: 400, note: '签证 & 保险', createdAt }
        ],
        packing: [
          { id: 'pk_bali_01', name: '护照', checked: true },
          { id: 'pk_bali_02', name: '防晒霜 SPF50+', checked: true },
          { id: 'pk_bali_03', name: '泳衣', checked: true },
          { id: 'pk_bali_04', name: '驱蚊液', checked: false },
          { id: 'pk_bali_05', name: '浮潜面镜', checked: false },
          { id: 'pk_bali_06', name: '沙滩裙 / 沙滩裤', checked: false },
          { id: 'pk_bali_07', name: '晕船药', checked: false },
          { id: 'pk_bali_08', name: '转换插头', checked: false }
        ]
      }
    ]
  };
}

module.exports = { seedData };
