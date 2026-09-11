const form = document.querySelector('#script-form');
const topicInput = document.querySelector('#topic');
const button = document.querySelector('#generate-button');
const message = document.querySelector('#form-message');
const emptyState = document.querySelector('#empty-state');
const loadingState = document.querySelector('#loading-state');
const content = document.querySelector('#result-content');
const status = document.querySelector('#result-status');
let currentVoiceover = '';

function setLoading(isLoading) {
  button.disabled = isLoading;
  button.querySelector('span').textContent = isLoading ? '正在创作脚本…' : '生成脚本';
  loadingState.hidden = !isLoading;
  loadingState.style.display = isLoading ? 'flex' : 'none';
  if (isLoading) { emptyState.hidden = true; content.hidden = true; status.textContent = '正在创作'; status.className = 'status working'; }
}

function text(value) { return String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])); }
function render(data) {
  document.querySelector('#hooks').innerHTML = (Array.isArray(data.hooks) ? data.hooks : []).slice(0, 3).map((hook, i) => `<article class="hook"><span class="hook-number">0${i + 1}</span><p>${text(hook)}</p></article>`).join('');
  document.querySelector('#storyboard').innerHTML = (Array.isArray(data.storyboard) ? data.storyboard : []).map(shot => `<article class="shot"><div class="shot-time">${text(shot.time)}</div><div class="shot-main"><label>分镜 / 画面</label><p>${text(shot.visual)}</p><div class="shoot-tip"><strong>拍摄引导</strong><span>${text(shot.shootingSuggestion)}</span></div></div><div class="shot-voice"><label>对应口播文案</label><p class="shot-topic">${text(shot.sectionTopic)}</p><p class="voice-copy">${text(shot.voiceover)}</p></div></article>`).join('');
  currentVoiceover = String(data.fullVoiceover || '');
  document.querySelector('#full-voiceover').textContent = currentVoiceover;
  content.hidden = false; emptyState.hidden = true; loadingState.hidden = true; loadingState.style.display = 'none';
  status.textContent = '已生成'; status.className = 'status ready';
}

form.addEventListener('submit', async event => {
  event.preventDefault(); message.textContent = '';
  if (!topicInput.value.trim()) { message.textContent = '请先输入视频主题'; topicInput.focus(); return; }
  setLoading(true);
  try {
    const fields = new FormData(form);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const response = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.fromEntries(fields)), signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error('request failed');
    const data = await response.json();
    if (!data || !Array.isArray(data.storyboard) || !data.fullVoiceover) throw new Error('invalid result');
    render(data);
  } catch (_) { message.textContent = '脚本生成失败，请重新尝试。'; status.textContent = '生成失败'; status.className = 'status'; emptyState.hidden = false; loadingState.hidden = true; }
  finally { setLoading(false); }
});

document.querySelector('#copy-button').addEventListener('click', async event => {
  if (!currentVoiceover) return;
  const copy = event.currentTarget;
  try { await navigator.clipboard.writeText(currentVoiceover); }
  catch (_) { const area = document.createElement('textarea'); area.value = currentVoiceover; document.body.append(area); area.select(); document.execCommand('copy'); area.remove(); }
  copy.textContent = '已复制 ✓'; setTimeout(() => { copy.textContent = '复制口播稿'; }, 1800);
});
