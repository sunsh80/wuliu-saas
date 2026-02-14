const bcrypt = require('bcryptjs');

// 从数据库获取的密码哈希
const hashedPassword = '$2a$10$2fcpKxiFJsIL/yAZ76OHO./IkLmpMoIMZlhwL27E2iNQIingxVJZ.';
const plainPassword = 'admin123';

bcrypt.compare(plainPassword, hashedPassword, (err, result) => {
  if (err) {
    console.error('比较出错:', err);
  } else {
    console.log('密码匹配结果:', result);
    if (result) {
      console.log('提供的密码与数据库中的哈希匹配');
    } else {
      console.log('提供的密码与数据库中的哈希不匹配');
      console.log('数据库中的哈希:', hashedPassword);
      console.log('尝试的密码:', plainPassword);
    }
  }
});