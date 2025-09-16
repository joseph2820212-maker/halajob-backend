import Queue from 'bull';

// إنشاء الطابور
const languageJop = new Queue('backgroundTasks', {
  redis: { host: '127.0.0.1', port: 6379 }, // إعدادات Redis
});

// وظيفة معالجة المهام
languageJop.process(async (job) => {
  console.log('Processing job:', job.data);

  // تنفيذ المهمة في الخلفية
  await performBackgroundTask(job.data);

  console.log('Job completed');
});

// تنفيذ المهام في الخلفية
async function performBackgroundTask(data) {
  console.log(`Processing background task with data: ${JSON.stringify(data)}`);
  // أضف هنا منطق المعالجة في الخلفية
}

export default languageJop;
