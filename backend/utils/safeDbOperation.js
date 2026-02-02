// backend/utils/safeDbOperation.js

/**
 * 安全执行数据库操作，带超时和重试机制
 * @param {Function} operation - 一个返回 Promise 的数据库操作函数
 * @param {Object} options - 配置项
 * @param {number} options.timeoutMs - 单次操作的超时时间 (毫秒). Default: 3000
 * @param {number} options.maxRetries - 最大重试次数. Default: 2
 * @param {number} options.retryDelayMs - 每次重试的延迟时间 (毫秒). Default: 500
 * @returns {Promise<any>} 操作结果
 */
async function safeDbOperation(operation, options = {}) {
  const {
    timeoutMs = 10000,
    maxRetries = 2,
    retryDelayMs = 500
  } = options;

  let lastError;
  let attempts = 0;

  while (attempts <= maxRetries) {
    attempts++;
    console.log(`[safeDbOperation] Attempt ${attempts}/${maxRetries + 1} starting...`);

    // 1. 创建一个 Promise 来包装数据库操作
    const opPromise = operation();

    // 2. 创建一个超时 Promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DATABASE_OPERATION_TIMEOUT')), timeoutMs)
    );

    try {
      // 3. 使用 Promise.race 竞赛，看哪个先完成
      const result = await Promise.race([opPromise, timeoutPromise]);
      console.log(`[safeDbOperation] Attempt ${attempts} succeeded.`);
      return result; // 成功则直接返回结果
    } catch (error) {
      lastError = error;
      console.error(`[safeDbOperation] Attempt ${attempts} failed:`, error.message);

      if (error.message === 'DATABASE_OPERATION_TIMEOUT') {
        // 如果是超时错误，并且不是最后一次尝试
        if (attempts < maxRetries + 1) {
          console.log(`[safeDbOperation] Timeout occurred. Waiting ${retryDelayMs}ms before retrying...`);
          await new Promise(resolve => setTimeout(resolve, retryDelayMs)); // 等待后重试
          continue; // 继续下一次循环（重试）
        }
      }
      // 如果是其他错误，或者已经是最后一次尝试，则跳出循环
      break;
    }
  }

  // 循环结束，说明所有尝试都失败了
  console.error(`[safeDbOperation] All ${maxRetries + 1} attempts failed. Throwing the last error.`);
  throw lastError; // 抛出最后一次的错误
}

module.exports = { safeDbOperation };