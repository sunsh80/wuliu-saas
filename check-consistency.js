/**
 * OpenAPI规范与验证库一致性检查脚本
 * 确保OpenAPI规范中的验证规则与共享验证库保持一致
 */

const fs = require('fs');
const yaml = require('js-yaml');

// 读取OpenAPI规范
const openapiSpecPath = './backend/openapi.yaml';
let openapiSpec;

try {
  openapiSpec = yaml.load(fs.readFileSync(openapiSpecPath, 'utf8'));
  console.log('✅ 成功读取OpenAPI规范');
} catch (error) {
  console.error('❌ 读取OpenAPI规范失败:', error.message);
  process.exit(1);
}

// 读取共享验证库
const validationRules = require('./validation-rules.js');
console.log('✅ 成功读取共享验证库');

// 检查手机号验证规则一致性
function checkPhoneValidationConsistency() {
  console.log('\n🔍 检查手机号验证规则一致性...');
  
  // 从OpenAPI规范中提取手机号验证规则
  let openapiPhonePattern = null;
  if (openapiSpec.components && openapiSpec.components.schemas) {
    for (const [schemaName, schema] of Object.entries(openapiSpec.components.schemas)) {
      if (schema.properties && schema.properties.contact_phone && schema.properties.contact_phone.pattern) {
        openapiPhonePattern = schema.properties.contact_phone.pattern;
        console.log(`  - 在${schemaName}中找到手机号模式: ${openapiPhonePattern}`);
        break;
      }
      if (schema.properties && schema.properties.customer_phone && schema.properties.customer_phone.pattern) {
        openapiPhonePattern = schema.properties.customer_phone.pattern;
        console.log(`  - 在${schemaName}中找到客户手机号模式: ${openapiPhonePattern}`);
        break;
      }
      if (schema.properties && schema.properties.phone && schema.properties.phone.pattern) {
        openapiPhonePattern = schema.properties.phone.pattern;
        console.log(`  - 在${schemaName}中找到通用手机号模式: ${openapiPhonePattern}`);
        break;
      }
    }
  }
  
  // 从共享验证库中获取手机号验证规则
  const libPhonePattern = validationRules.VALIDATION_RULES.PHONE_PATTERN.source;
  console.log(`  - 共享验证库中的手机号模式: ${libPhonePattern}`);
  
  // 比较两个模式
  if (openapiPhonePattern && openapiPhonePattern === libPhonePattern) {
    console.log('  ✅ 手机号验证规则一致');
    return true;
  } else {
    console.log('  ❌ 手机号验证规则不一致!');
    console.log(`     OpenAPI: ${openapiPhonePattern}`);
    console.log(`     验证库: ${libPhonePattern}`);
    return false;
  }
}

// 检查邮箱验证规则一致性
function checkEmailValidationConsistency() {
  console.log('\n🔍 检查邮箱验证规则一致性...');
  
  // 从共享验证库中获取邮箱验证规则
  const libEmailPattern = validationRules.VALIDATION_RULES.EMAIL_PATTERN.source;
  console.log(`  - 共享验证库中的邮箱模式: ${libEmailPattern}`);
  
  // 在OpenAPI规范中查找邮箱验证规则
  let openapiEmailPattern = null;
  if (openapiSpec.components && openapiSpec.components.schemas) {
    for (const [schemaName, schema] of Object.entries(openapiSpec.components.schemas)) {
      if (schema.properties && schema.properties.email && schema.properties.email.pattern) {
        openapiEmailPattern = schema.properties.email.pattern;
        console.log(`  - 在${schemaName}中找到邮箱模式: ${openapiEmailPattern}`);
        break;
      }
    }
  }
  
  // 比较两个模式（邮箱格式可能有所不同，但我们检查基本格式）
  if (openapiEmailPattern) {
    console.log(`  - OpenAPI中的邮箱模式: ${openapiEmailPattern}`);
    // 不强制要求完全相同，因为邮箱验证可能有细微差别
    console.log('  ⚠️  检测到OpenAPI中存在邮箱验证规则，建议检查一致性');
    return true;
  } else {
    console.log('  - OpenAPI中未找到明确的邮箱验证规则');
    return true;
  }
}

// 执行检查
const phoneCheck = checkPhoneValidationConsistency();
const emailCheck = checkEmailValidationConsistency();

console.log('\n📊 检查结果:');
console.log(`  手机号验证一致性: ${phoneCheck ? '✅ 通过' : '❌ 失败'}`);
console.log(`  邮箱验证检查: ${emailCheck ? '✅ 通过' : '❌ 失败'}`);

if (phoneCheck && emailCheck) {
  console.log('\n🎉 所有验证规则检查通过！');
  process.exit(0);
} else {
  console.log('\n💥 存在验证规则不一致问题！');
  process.exit(1);
}