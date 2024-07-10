// write your NFT miner here
import { Address, toNano, TonClient } from 'ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { BN } from 'bn.js';
import { unixNow } from './src/lib/utils';
import { MineMessageParams, Queries } from './src/giver/NftGiver.data';
async function main() {
  const wallet = Address.parse(
    '0QDIEpsdnLYz_Hf4I6IxXAch6G5fyB7EeQHETkbL5ZftGCXB'
  );
  const collect = Address.parse(
    'EQDk8N7xM5D669LC2YACrseBJtDyFqwtSPCNhRWXU7kjEptX'
  );
  const endpoint = await getHttpEndpoint({
    network: 'testnet',
  });
  const Client = new TonClient({ endpoint });
  const miningData = await Client.callGetMethod(collect, 'get_mining_data');
  console.log(`${miningData}`);
  const parseStackNum = (sn: any) => new BN(sn[1].substring(2), 'hex');

  const complexity = parseStackNum(miningData.stack[0]);
  const last_success = parseStackNum(miningData.stack[1]);
  const seed = parseStackNum(miningData.stack[2]);
  const target_delta = parseStackNum(miningData.stack[3]);
  const min_cpl = parseStackNum(miningData.stack[4]);
  const max_cpl = parseStackNum(miningData.stack[5]);

  console.log('complexity', complexity);
  console.log('last_success', last_success.toString());
  console.log('seed', seed);
  console.log('target_delta', target_delta.toString());
  console.log('min_cpl', min_cpl.toString());
  console.log('max_cpl', max_cpl.toString());

  const mineParams: MineMessageParams = {
    expire: unixNow() + 300,
    mintTo: wallet,
    data1: new BN(0),
    seed,
  };
  let msg = Queries.mine(mineParams);
  let progress = 0;

  while (new BN(msg.hash(), 'be').gt(complexity)) {
    progress += 1;
    console.clear();
    console.log(`挖矿开始：请等待30-60秒以挖掘您的NFT！`);
    console.log(' ');
    console.log(
      `⛏ 已挖掘 ${progress} 个哈希！最新的：`,
      new BN(msg.hash(), 'be').toString()
    );

    mineParams.expire = unixNow() + 300;
    mineParams.data1.iaddn(1);
    msg = Queries.mine(mineParams);
  }

  console.log(' ');
  console.log('💎 任务完成：找到小于pow_complexity的msg_hash了！');
  console.log(' ');
  console.log('msg_hash: ', new BN(msg.hash(), 'be').toString());
  console.log('pow_complexity: ', complexity.toString());
  console.log(
    'msg_hash < pow_complexity: ',
    new BN(msg.hash(), 'be').lt(complexity)
  );

  console.log(' ');
  console.log('💣 警告！一旦您找到哈希，您应该迅速发送交易。');
  console.log(
    '如果其他人在您之前发送交易，seed会改变，您将不得不重新找到哈希！'
  );
  console.log(' ');

  const collectionAddr = collect.toFriendly({
    urlSafe: true,
    bounceable: true,
  });
  const amoutTosend = toNano('0.05').toString();
  const prepareBodyCell = msg.toBoc().toString('base64url');
  const tonDeepLink = (address: string, amount: string, body: string) => {
    return `ton://transfer/${address}?amout=${amount}&bin=${body}`;
  };
  const link = tonDeepLink(collectionAddr, amoutTosend, prepareBodyCell);
  console.log('🚀 领取NFT的链接：');
  console.log(link);

  const qrcode = require(`qrcode-terminal`);
  qrcode.generate(link, { small: true }, function (qrcode: any) {
    console.log('🚀 用Tonkeeper挖掘NFT的链接（在测试网模式下使用）：');
    console.log(qrcode);
    console.log('* 如果二维码仍然太大，请在终端运行脚本。（或者缩小字体）');
  });
}

main();
