const { scheduler } = require('../../../utils/scheduler')
const { getCookies, saveCookies } = require('../../../utils/util')
const _request = require('../../../utils/request')

var start = async (params) => {
  const { cookies, options } = params

  let savedCookies = await getCookies('unicom_' + options.user)
  if (!savedCookies) {
    savedCookies = cookies
  }
  const request = _request(savedCookies, true)

  await require('./init')(request, {
    ...params,
    cookies: savedCookies
  })

  // 每日签到积分
  await scheduler.regTask('dailysignin', async () => {
    result = await require('./integral').getSigninIntegral(request, options)
    let integralTotal = result.integralTotal
    result = await require('./integral').signTask(request, options)
    if (result.status === '0000') {
      if (result.data.todaySigned === '1') {
        result = await require('./integral').daySign(request, options)
        await require('./integral').todaySign(request, options)
        if (result.status === '0000') {
          console.log('积分签到成功+' + (result.data.newCoin - integralTotal) + '积分', '总积分:' + result.data.newCoin)
        } else {
          console.log('积分签到失败', result.msg)
        }
      } else {
        console.log('今日已积分签到')
      }
    } else {
      console.log('获取积分签到任务失败', result.msg)
    }
  })

  // 冬奥积分活动 20201231
  await scheduler.regTask('winterTwo', async () => {
    await require('./integral').winterTwoGetIntegral(request, options)
    await require('./integral').winterTwoStatus(request, options)
  })

  // 每日定向积分 20201231
  await scheduler.regTask('dxIntegralEveryDay', async () => {
    await require('./integral').dxIntegralEveryDay(request, options)
  })

  // 每日游戏楼层宝箱
  await scheduler.regTask('dailygamebox', async () => {
    await require('./integral').gamebox(request, options)
  })

  // 每日免费抽奖
  await scheduler.regTask('dailylottery', async () => {
    await require('./integral').dailylottery(request, options)
  })

  // 每日豪礼大派送抽奖
  await scheduler.regTask('jflottery', async () => {
    await require('./jflottery').timesDraw(request, options)
  })

  // 每日娱乐中心打卡
  await scheduler.regTask('producGame', async () => {
    await require('./producGame').gameSignin(request, options)
  })

  // 每日沃之树
  await scheduler.regTask('dailywoTree', async () => {
    let i = 2
    do {
      // 普通 - 看视频 似乎是分开的两次
      result = await require('./woTree').getStatus(request, options)
      await require('./woTree').takeFlow(request, {
        options,
        flowChangeList: result.flowChangeList
      })
    } while (i--)
    await require('./woTree').takePop(request, {
      options,
      popList: result.popList
    })
  })

  // 每日游戏时长-天天领取流量包 -- 作废
  // await scheduler.regTask('dailygameflow', async () => {
  //   let allgames = await require('./producGame').popularGames(request, options)
  //   let games = await require('./producGame').timeTaskQuery(request, options)
  //   games = allgames.filter(g => games.map(i => i.gameId).indexOf(g.id) !== -1)
  //   console.log('剩余game', games.length)
  //   for (let game of games) {
  //     console.log(game.name)
  //     let launchtime = new Date().getTime()
  //     let { appInfo } = await require('./producGame').gameInfo(request, {
  //       ...options,
  //       game
  //     })
  //     await require('./producGame').UseUserApp(request, {
  //       ...options,
  //       game,
  //       app: appInfo
  //     })
  //     await require('./producGame').recordGame(request, {
  //       ...options,
  //       gameId: game.gameId
  //     })
  //     await require('./producGame').recordGame1(request, {
  //       ...options,
  //       gameId: game.gameId
  //     })
  //     await require('./producGame').gameverify(request, {
  //       ...options,
  //       game
  //     })
  //     let launchid = await require('./producGame').reportTransfer(request, {
  //       ...options,
  //       game,
  //       app: appInfo,
  //       action: 'click'
  //     })
  //     let i = 5
  //     do {
  //       await require('./producGame').gameReportTime(request, {
  //         ...options,
  //         game,
  //         launchid
  //       })
  //       await new Promise((resolve, reject) => {
  //         setTimeout(resolve, 30 * 1000)
  //       })
  //     } while (i--)
  //     await require('./producGame').reportTransfer(request, {
  //       ...options,
  //       game,
  //       app: appInfo,
  //       action: 'close',
  //       launchid
  //     })
  //     await require('./producGame').reportTimeEvent(request, {
  //       ...options,
  //       game,
  //       app: appInfo,
  //       launchid,
  //       launchtime
  //     })
  //     await new Promise((resolve, reject) => {
  //       setTimeout(resolve, 30 * 1000)
  //     })
  //     await require('./producGame').gameFlowGet(request, {
  //       ...options,
  //       gameId: game.gameId
  //     })
  //   }
  // })

  // await require('./integral').getflDetail(request, options)
  // await require('./integral').getTxDetail(request, options)
  // await require('./integral').getDxDetail(request, options)
  // await require('./integral').getCoins(request, options)

  // 每日评论积分
  await scheduler.regTask('dailycomment', async () => {
    await require('./commentSystem').commentTask(request, options).catch(console.log)
  })
}
module.exports = {
  start
}