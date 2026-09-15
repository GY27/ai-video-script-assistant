const SYSTEM_PROMPT = `你是一名专业短视频编导和短视频脚本创作者。根据主题、时长、内容类型和创作要求，一次性输出可拍摄的短视频脚本。前3秒进入核心；口播像真人自然说话，多短句；每5至10秒有新信息；整体为 Hook → 核心信息 → 解释 → 例子或证明 → 结论 → CTA。不得编造价格、参数、销量、政策、新闻、研究数据或人物言论；事实不足时用中性、安全的表达。严格只返回 JSON，不要 Markdown，不要额外解释。JSON 格式：{"topic":"","hooks":["","",""],"summary":"","storyboard":[{"time":"0-5秒","visual":"","shootingSuggestion":"","sectionTopic":"","voiceover":""}],"fullVoiceover":""}。fullVoiceover 必须是一篇连贯、可直接粘贴到提词器的纯口播，不含时间、镜头、画面、拍摄建议、标题、备注或括号说明。`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
}

function cleanJson(value) {
  const cleaned = String(value || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('Model did not return JSON');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function demoScript(topic, duration, contentType) {
  const subject = topic || '21款小鹏P7为什么现在值得买？';
  return {
    topic: subject,
    hooks: [
      `想买一台有设计感的纯电轿跑？先别急着只看新车，${subject}值得你花一分钟了解。`,
      `很多人买车只盯着配置表，但${subject}，关键其实是先想清楚自己的使用场景。`,
      `如果你正在纠结${subject}，这三个判断方式，能帮你少走不少弯路。`
    ],
    summary: `${contentType}短视频脚本，时长约${duration}。`,
    storyboard: [
      { time:'0–5秒', visual:'人物站在车旁或面对镜头，开门见山。', shootingSuggestion:'镜头从近景开始，直接看镜头说话。', sectionTopic:'抛出问题', voiceover:`${subject}，到底适不适合你？先别急着下结论。` },
      { time:'5–13秒', visual:'拍摄外观、日常出行或相关产品细节。', shootingSuggestion:'用两三个简洁特写，画面跟着口播切换。', sectionTopic:'说清适合谁', voiceover:'先看你的真实需求。你更在意日常通勤、使用体验，还是预算里的综合价值？' },
      { time:'13–22秒', visual:'人物边走边讲，穿插功能或使用场景。', shootingSuggestion:'保持画面干净，用真实场景替代参数堆砌。', sectionTopic:'核心判断一', voiceover:'别只看宣传里的亮点。把你每天会遇到的场景列出来，答案会更清楚。' },
      { time:'22–32秒', visual:'切换到车内或体验细节，人物指向重点。', shootingSuggestion:'一个镜头只讲一个重点，节奏放轻快。', sectionTopic:'核心判断二', voiceover:'第二个重点，是你能不能接受它的取舍。没有一款产品适合所有人，适合自己才重要。' },
      { time:'32–43秒', visual:'人物正面出镜，配合生活化B-roll。', shootingSuggestion:'镜头稳定，口播留出停顿。', sectionTopic:'避免踩坑', voiceover:'如果信息还不够，就去实际体验。把你最在意的两三件事，亲自感受一遍。' },
      { time:'43–54秒', visual:'回到主体全景，人物总结。', shootingSuggestion:'用中景收束，避免夸张表情和手势。', sectionTopic:'给出结论', voiceover:`所以，${subject}不该只用一句“值不值”回答。它更像是一次匹配：需求对上了，才是真的值得。` },
      { time:'54–60秒', visual:'人物看镜头结束，画面定格在主体上。', shootingSuggestion:'最后一句放慢一点，留出结尾空间。', sectionTopic:'行动引导', voiceover:'你最在意哪一点？评论区告诉我，我帮你一起拆一拆。' }
    ],
    fullVoiceover: `${subject}，到底适不适合你？先别急着下结论。\n\n先看你的真实需求。你更在意日常通勤、使用体验，还是预算里的综合价值？\n\n别只看宣传里的亮点。把你每天会遇到的场景列出来，答案会更清楚。\n\n第二个重点，是你能不能接受它的取舍。没有一款产品适合所有人，适合自己才重要。\n\n如果信息还不够，就去实际体验。把你最在意的两三件事，亲自感受一遍。\n\n所以，${subject}不该只用一句“值不值”回答。它更像是一次匹配：需求对上了，才是真的值得。\n\n你最在意哪一点？评论区告诉我，我帮你一起拆一拆。`
  };
}

export async function onRequestPost(context) {
  try {
    const { topic, duration = '60秒', contentType = '知识分享', requirements = '', personaTemplate = '朋友分享型', persona = '', model: requestedModel = 'DeepSeek' } = await context.request.json();
    if (!String(topic || '').trim()) return json({ error: 'Topic is required' }, 400);
    if (String(context.env.DEMO_MODE || '').toLowerCase() === 'true') return json(demoScript(topic.trim(), duration, contentType));

    const isGlm = String(requestedModel).toLowerCase() === 'glm';
    const apiKey = isGlm ? context.env.GLM_API_KEY : context.env.MODEL_API_KEY;
    const baseUrl = isGlm ? (context.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4') : context.env.MODEL_BASE_URL;
    const model = isGlm ? (context.env.GLM_MODEL || 'glm-4-flash') : (context.env.DEEPSEEK_MODEL || 'deepseek-flash');
    if (!apiKey || !baseUrl || !model) return json({ error: 'Model is not configured' }, 503);
    const webSearchEnabled = String(context.env.ENABLE_WEB_SEARCH ?? 'true').toLowerCase() !== 'false';
    const deepseekRoot = String(baseUrl || 'https://api.deepseek.com').replace(/\/$/, '').replace(/\/v1$/, '');
    const endpoint = isGlm ? `${String(baseUrl).replace(/\/$/, '')}/chat/completions` : `${deepseekRoot}/responses`;
    const userInput = `主题：${topic}\n时长：${duration}\n内容类型：${contentType}\n人设模板：${personaTemplate}\n人设与能力边界：${persona || '沿用模板'}\n额外创作要求：${requirements || '无'}\n\n请在生成前联网核实产品规格、价格、卖点和官网信息。最多搜索 2 次，优先官方网站和权威评测；无法确认的信息标注“待核实”，不要猜测。`;
    const requestBody = isGlm
      ? { model, temperature: 0.7, response_format: { type: 'json_object' }, messages: [{ role:'system', content:SYSTEM_PROMPT }, { role:'user', content:userInput }] }
      : { model, instructions: SYSTEM_PROMPT, input: userInput, max_output_tokens: 4000, text: { format: { type: 'json_object' } }, ...(webSearchEnabled ? { tools: [{ type: 'web_search' }], tool_choice: 'auto' } : {}) };
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(requestBody)
    });
    if (!upstream.ok) throw new Error('Upstream model request failed');
    const payload = await upstream.json();
    if (!isGlm) console.log('DeepSeek usage:', JSON.stringify(payload?.usage || {}), 'status:', payload?.status, 'web_search:', (payload?.output || []).some(item => item?.type === 'web_search_call'));
    if (!isGlm && payload?.status === 'failed') throw new Error(payload?.error?.message || 'DeepSeek response failed');
    const outputText = isGlm ? payload?.choices?.[0]?.message?.content : payload?.output_text;
    return json(cleanJson(outputText));
  } catch (error) {
    console.error('generate failed', error);
    return json({ error: 'Unable to generate script' }, 500);
  }
}

export function onRequest() { return json({ error: 'Method not allowed' }, 405); }
