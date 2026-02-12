<template>
  <div class="internal-settings-container">
    <h1>内部设置</h1>

    <!-- 系统配置 -->
    <section class="settings-section">
      <h2>系统配置</h2>
      
      <div class="settings-grid">
        <div class="setting-item">
          <label for="systemName">系统名称:</label>
          <input
            type="text"
            id="systemName"
            v-model="systemSettings.systemName"
            @change="updateSetting"
          />
        </div>
        
        <div class="setting-item">
          <label for="systemVersion">系统版本:</label>
          <input
            type="text"
            id="systemVersion"
            v-model="systemSettings.version"
            @change="updateSetting"
          />
        </div>
        
        <div class="setting-item">
          <label for="timezone">时区设置:</label>
          <select id="timezone" v-model="systemSettings.timezone" @change="updateSetting">
            <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
            <option value="Asia/Tokyo">日本标准时间 (UTC+9)</option>
            <option value="America/New_York">美国东部时间 (UTC-5)</option>
            <option value="Europe/London">格林威治标准时间 (UTC+0)</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label for="dateFormat">日期格式:</label>
          <select id="dateFormat" v-model="systemSettings.dateFormat" @change="updateSetting">
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY年MM月DD日">YYYY年MM月DD日</option>
          </select>
        </div>
        
        <div class="setting-item full-width">
          <label>
            <input
              type="checkbox"
              v-model="systemSettings.maintenanceMode"
              @change="updateSetting"
            />
            启用维护模式
          </label>
          <p class="setting-description">启用后，非管理员用户将无法访问系统</p>
        </div>
      </div>
    </section>

    <!-- 用户管理设置 -->
    <section class="settings-section">
      <h2>用户管理设置</h2>
      
      <div class="settings-grid">
        <div class="setting-item">
          <label for="passwordMinLength">密码最小长度:</label>
          <input
            type="number"
            id="passwordMinLength"
            v-model="userSettings.passwordMinLength"
            min="6"
            max="20"
            @change="updateSetting"
          />
        </div>
        
        <div class="setting-item">
          <label for="passwordComplexity">密码复杂度要求:</label>
          <select id="passwordComplexity" v-model="userSettings.passwordComplexity" @change="updateSetting">
            <option value="simple">简单 (仅字母数字)</option>
            <option value="medium">中等 (字母+数字+特殊字符)</option>
            <option value="strong">强 (大小写字母+数字+特殊字符)</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label for="sessionTimeout">会话超时 (分钟):</label>
          <input
            type="number"
            id="sessionTimeout"
            v-model="userSettings.sessionTimeout"
            min="5"
            max="1440"
            @change="updateSetting"
          />
        </div>
        
        <div class="setting-item full-width">
          <label>
            <input
              type="checkbox"
              v-model="userSettings.requireEmailVerification"
              @change="updateSetting"
            />
            注册时需要邮箱验证
          </label>
        </div>
        
        <div class="setting-item full-width">
          <label>
            <input
              type="checkbox"
              v-model="userSettings.requirePhoneVerification"
              @change="updateSetting"
            />
            注册时需要手机验证
          </label>
        </div>
      </div>
    </section>

    <!-- 安全设置 -->
    <section class="settings-section">
      <h2>安全设置</h2>
      
      <div class="settings-grid">
        <div class="setting-item">
          <label for="loginAttempts">登录尝试次数限制:</label>
          <input
            type="number"
            id="loginAttempts"
            v-model="securitySettings.loginAttempts"
            min="1"
            max="10"
            @change="updateSetting"
          />
        </div>
        
        <div class="setting-item">
          <label for="lockoutDuration">账户锁定时长 (分钟):</label>
          <input
            type="number"
            id="lockoutDuration"
            v-model="securitySettings.lockoutDuration"
            min="1"
            max="1440"
            @change="updateSetting"
          />
        </div>
        
        <div class="setting-item full-width">
          <label>
            <input
              type="checkbox"
              v-model="securitySettings.enableTwoFactorAuth"
              @change="updateSetting"
            />
            启用双因素认证
          </label>
        </div>
        
        <div class="setting-item full-width">
          <label>
            <input
              type="checkbox"
              v-model="securitySettings.enableIPWhitelist"
              @change="updateSetting"
            />
            启用IP白名单
          </label>
          <div v-if="securitySettings.enableIPWhitelist" class="nested-setting">
            <textarea
              v-model="securitySettings.ipWhitelist"
              rows="4"
              placeholder="请输入允许访问的IP地址，每行一个"
              @change="updateSetting"
            ></textarea>
          </div>
        </div>
      </div>
    </section>

    <!-- 通知设置 -->
    <section class="settings-section">
      <h2>通知设置</h2>
      
      <div class="settings-grid">
        <div class="setting-item full-width">
          <label>
            <input
              type="checkbox"
              v-model="notificationSettings.emailNotifications"
              @change="updateSetting"
            />
            启用邮件通知
          </label>
          <div v-if="notificationSettings.emailNotifications" class="nested-setting">
            <div class="form-group">
              <label>SMTP服务器:</label>
              <input
                type="text"
                v-model="notificationSettings.smtpServer"
                @change="updateSetting"
              />
            </div>
            <div class="form-group">
              <label>SMTP端口:</label>
              <input
                type="number"
                v-model="notificationSettings.smtpPort"
                @change="updateSetting"
              />
            </div>
            <div class="form-group">
              <label>发件人邮箱:</label>
              <input
                type="email"
                v-model="notificationSettings.senderEmail"
                @change="updateSetting"
              />
            </div>
          </div>
        </div>
        
        <div class="setting-item full-width">
          <label>
            <input
              type="checkbox"
              v-model="notificationSettings.smsNotifications"
              @change="updateSetting"
            />
            启用短信通知
          </label>
          <div v-if="notificationSettings.smsNotifications" class="nested-setting">
            <div class="form-group">
              <label>SMS提供商:</label>
              <select v-model="notificationSettings.smsProvider" @change="updateSetting">
                <option value="aliyun">阿里云</option>
                <option value="tencent">腾讯云</option>
                <option value="huawei">华为云</option>
              </select>
            </div>
            <div class="form-group">
              <label>API密钥:</label>
              <input
                type="password"
                v-model="notificationSettings.smsApiKey"
                @change="updateSetting"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 数据备份与恢复 -->
    <section class="settings-section">
      <h2>数据备份与恢复</h2>
      
      <div class="backup-controls">
        <div class="control-group">
          <h3>自动备份设置</h3>
          <div class="setting-item">
            <label>
              <input
                type="checkbox"
                v-model="backupSettings.autoBackupEnabled"
                @change="updateSetting"
              />
              启用自动备份
            </label>
          </div>
          <div class="form-row">
            <div class="setting-item">
              <label>备份频率:</label>
              <select v-model="backupSettings.backupFrequency" @change="updateSetting">
                <option value="daily">每日</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
            </div>
            <div class="setting-item">
              <label>备份时间:</label>
              <input
                type="time"
                v-model="backupSettings.backupTime"
                @change="updateSetting"
              />
            </div>
          </div>
          <div class="setting-item">
            <label>备份保存天数:</label>
            <input
              type="number"
              v-model="backupSettings.retentionDays"
              min="1"
              max="365"
              @change="updateSetting"
            />
          </div>
        </div>
        
        <div class="control-group">
          <h3>手动备份</h3>
          <div class="backup-actions">
            <button @click="createBackup" class="btn btn-primary">立即创建备份</button>
            <button @click="restoreFromBackup" class="btn btn-secondary">从备份恢复</button>
            <button @click="downloadBackup" class="btn btn-outline">下载备份文件</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button @click="saveSettings" class="btn btn-primary" :disabled="saving">
        {{ saving ? '保存中...' : '保存设置' }}
      </button>
      <button @click="resetSettings" class="btn btn-secondary" :disabled="saving">恢复默认</button>
      <button @click="testSettings" class="btn btn-success" :disabled="saving">测试配置</button>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="saving" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'

export default {
  name: 'InternalSettingsView',
  setup() {
    // 系统设置
    const systemSettings = reactive({
      systemName: '物流管理系统',
      version: '1.0.0',
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD',
      maintenanceMode: false
    })

    // 用户设置
    const userSettings = reactive({
      passwordMinLength: 8,
      passwordComplexity: 'medium',
      sessionTimeout: 60,
      requireEmailVerification: true,
      requirePhoneVerification: false
    })

    // 安全设置
    const securitySettings = reactive({
      loginAttempts: 5,
      lockoutDuration: 30,
      enableTwoFactorAuth: false,
      enableIPWhitelist: false,
      ipWhitelist: '192.168.1.1\n10.0.0.1'
    })

    // 通知设置
    const notificationSettings = reactive({
      emailNotifications: true,
      smtpServer: 'smtp.gmail.com',
      smtpPort: 587,
      senderEmail: 'noreply@example.com',
      smsNotifications: false,
      smsProvider: 'aliyun',
      smsApiKey: ''
    })

    // 备份设置
    const backupSettings = reactive({
      autoBackupEnabled: true,
      backupFrequency: 'daily',
      backupTime: '02:00',
      retentionDays: 30
    })

    // 保存状态
    const saving = ref(false)

    // 更新设置
    const updateSetting = () => {
      console.log('设置已更新')
    }

    // 保存所有设置
    const saveSettings = async () => {
      try {
        saving.value = true
        
        // 这里应该调用API保存设置
        console.log('保存系统设置:', {
          systemSettings,
          userSettings,
          securitySettings,
          notificationSettings,
          backupSettings
        })
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        alert('系统设置保存成功！')
      } catch (error) {
        console.error('保存设置失败:', error)
        alert('保存失败: ' + error.message)
      } finally {
        saving.value = false
      }
    }

    // 重置为默认设置
    const resetSettings = () => {
      if (confirm('确定要恢复所有设置为默认值吗？此操作不可逆！')) {
        // 重置系统设置
        systemSettings.systemName = '物流管理系统'
        systemSettings.version = '1.0.0'
        systemSettings.timezone = 'Asia/Shanghai'
        systemSettings.dateFormat = 'YYYY-MM-DD'
        systemSettings.maintenanceMode = false

        // 重置用户设置
        userSettings.passwordMinLength = 8
        userSettings.passwordComplexity = 'medium'
        userSettings.sessionTimeout = 60
        userSettings.requireEmailVerification = true
        userSettings.requirePhoneVerification = false

        // 重置安全设置
        securitySettings.loginAttempts = 5
        securitySettings.lockoutDuration = 30
        securitySettings.enableTwoFactorAuth = false
        securitySettings.enableIPWhitelist = false
        securitySettings.ipWhitelist = '192.168.1.1\n10.0.0.1'

        // 重置通知设置
        notificationSettings.emailNotifications = true
        notificationSettings.smtpServer = 'smtp.gmail.com'
        notificationSettings.smtpPort = 587
        notificationSettings.senderEmail = 'noreply@example.com'
        notificationSettings.smsNotifications = false
        notificationSettings.smsProvider = 'aliyun'
        notificationSettings.smsApiKey = ''

        // 重置备份设置
        backupSettings.autoBackupEnabled = true
        backupSettings.backupFrequency = 'daily'
        backupSettings.backupTime = '02:00'
        backupSettings.retentionDays = 30
      }
    }

    // 测试设置
    const testSettings = () => {
      alert('正在测试配置连接性...')
      console.log('测试配置:', {
        systemSettings,
        userSettings,
        securitySettings,
        notificationSettings
      })
    }

    // 创建备份
    const createBackup = () => {
      alert('正在创建系统备份...')
      console.log('创建备份:', backupSettings)
    }

    // 从备份恢复
    const restoreFromBackup = () => {
      if (confirm('确定要从备份恢复数据吗？这将覆盖当前所有数据！')) {
        alert('正在从备份恢复数据...')
      }
    }

    // 下载备份
    const downloadBackup = () => {
      alert('正在准备下载备份文件...')
    }

    return {
      systemSettings,
      userSettings,
      securitySettings,
      notificationSettings,
      backupSettings,
      saving,
      updateSetting,
      saveSettings,
      resetSettings,
      testSettings,
      createBackup,
      restoreFromBackup,
      downloadBackup
    }
  }
}
</script>

<style scoped>
.internal-settings-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.settings-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.settings-section h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.setting-item {
  display: flex;
  flex-direction: column;
}

.setting-item.full-width {
  grid-column: 1 / -1;
}

.setting-item label {
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-item input,
.setting-item select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.setting-item input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

.setting-description {
  margin: 5px 0 0 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.nested-setting {
  margin-top: 10px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .setting-item {
  flex: 1;
}

.backup-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-group {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.control-group h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.backup-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #218838;
}

.btn-outline {
  background-color: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline:hover {
  background-color: #007bff;
  color: white;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #fff;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>