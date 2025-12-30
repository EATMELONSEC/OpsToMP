import { TFile } from 'obsidian';

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function sanitizeHtml(html) {
  console.log('sanitizeHtml 被调用，输入内容（前200字符）:', html.substring(0, 200));
  if (!html) return '';
  
  const tempDiv = document.createElement('div');
  
  const decoderDiv = document.createElement('div');
  decoderDiv.textContent = html;
  const decodedHtml = decoderDiv.innerHTML;
  
  console.log('解码后的内容（前200字符）:', decodedHtml.substring(0, 200));
  
  if (decodedHtml !== html) {
    console.log('检测到HTML实体编码，使用解码后的内容');
    html = decodedHtml;
  } else {
    console.log('未检测到HTML实体编码，使用原内容');
  }
  
  tempDiv.innerHTML = html;
  
  const allowedTags = new Set([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'u', 's', 'b', 'i',
    'ul', 'ol', 'li',
    'pre', 'code', 'kbd',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'blockquote', 'span', 'div',
    'input', 'label', 'sup', 'sub'
  ]);
  
  const allowedAttributes = new Set([
    'src', 'alt', 'title', 'width', 'height',
    'href', 'target', 'rel',
    'class', 'id', 'style',
    'colspan', 'rowspan',
    'type', 'checked', 'disabled', 'name', 'value',
    'for', 'data-line', 'data-source'
  ]);
  
  const allowedStyles = new Set([
    'color', 'background-color', 'font-size', 'font-weight',
    'text-align', 'margin', 'padding', 'line-height',
    'width', 'height', 'border', 'border-radius',
    'display', 'text-indent',
    'font-family', 'font-style', 'text-decoration',
    'white-space', 'overflow', 'overflow-x', 'overflow-y',
    'position', 'top', 'right', 'bottom', 'left',
    'float', 'clear', 'vertical-align',
    'background', 'background-image', 'background-repeat',
    'background-position', 'background-size',
    'box-shadow', 'text-shadow', 'opacity',
    'transform', 'transition', 'animation'
  ]);
  
  const isSafeUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsedUrl = new URL(url, 'http://example.com');
      return ['http:', 'https:', 'app:', 'file:'].includes(parsedUrl.protocol);
    } catch (e) {
      return false;
    }
  };
  
  const processElement = (element) => {
    if (!allowedTags.has(element.tagName.toLowerCase())) {
      const textNode = document.createTextNode(element.textContent);
      element.parentNode.replaceChild(textNode, element);
      return;
    }
    
    Array.from(element.attributes).forEach(attr => {
      const attrName = attr.name.toLowerCase();
      const attrValue = attr.value;
      
      if (attrName.startsWith('data-')) {
        return;
      }
      
      if (!allowedAttributes.has(attrName)) {
        element.removeAttribute(attr.name);
      } else if (attrName === 'href' || attrName === 'src') {
        if (!isSafeUrl(attrValue)) {
          element.setAttribute(attr.name, attrName === 'href' ? '#' : '');
        } else if (attrName === 'href') {
          element.setAttribute('target', '_blank');
          element.setAttribute('rel', 'noopener noreferrer');
        }
      } else if (attrName === 'style') {
        const styleDeclarations = attrValue.split(';');
        const safeStyles = [];
        
        styleDeclarations.forEach(declaration => {
          const parts = declaration.split(':').map(part => part.trim());
          if (parts.length === 2) {
            const [property, value] = parts;
            if (allowedStyles.has(property.toLowerCase())) {
              safeStyles.push(`${property}: ${value}`);
            }
          }
        });
        
        if (safeStyles.length > 0) {
          element.setAttribute('style', safeStyles.join('; '));
        } else {
          element.removeAttribute('style');
        }
      } else if (attrName === 'class') {
        element.setAttribute(attr.name, attrValue);
      } else if (attrName === 'id') {
        element.setAttribute(attr.name, attrValue);
      } else {
        element.setAttribute(attr.name, escapeHtml(attrValue));
      }
    });
    
    Array.from(element.childNodes).forEach(child => {
      if (child.nodeType === 1) {
        processElement(child);
      }
    });
  };
  
  Array.from(tempDiv.childNodes).forEach(child => {
    if (child.nodeType === 1) {
      processElement(child);
    }
  });
  
  return tempDiv.innerHTML;
}

export function processInternalLinks(htmlContent) {
  const internalImageRegex = /!\[\[(.*?)\]\]/g;
  
  return htmlContent.replace(internalImageRegex, (match, imagePath) => {
    const cleanPath = imagePath.split('|')[0].trim();
    return `<img src="${cleanPath}" alt="${cleanPath}">`;
  });
}

export async function processContentImages(htmlContent, accessToken, activeFile, uploadSingleImage, app) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const images = tempDiv.querySelectorAll('img');
  
  for (const img of images) {
    let src = img.getAttribute('src');
    if (!src) continue;
    
    if (!src.startsWith('http://') && !src.startsWith('https://')) {
      try {
        let file;
        
        if (src.startsWith('app://local/')) {
          const localPath = decodeURIComponent(src.replace('app://local/', ''));
          file = app.vault.getAbstractFileByPath(localPath);
        } else if (src.startsWith('file:///')) {
          const localPath = decodeURIComponent(src.replace('file:///', ''));
          const files = app.vault.getAllFiles();
          file = files.find(f => f.path === localPath || f.path.endsWith(localPath));
        } else {
          file = app.metadataCache.getFirstLinkpathDest(src, activeFile.path);
        }
        
        if (file && file instanceof TFile) {
          const fileContent = await app.vault.readBinary(file);
          const fileBuffer = Buffer.from(fileContent);
          
          const imageUrl = await uploadSingleImage(
            accessToken, 
            fileBuffer, 
            file.name, 
            'image/' + file.extension
          );
          
          img.setAttribute('src', imageUrl);
          
          console.log('成功上传图片:', file.name, '->', imageUrl);
        }
      } catch (error) {
        console.error('处理图片失败:', error);
      }
    }
  }
  
  return tempDiv.innerHTML;
}

export async function processImagePaths(htmlContent, activeFile, app) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const images = tempDiv.querySelectorAll('img');
  
  for (const img of images) {
    let src = img.getAttribute('src');
    if (!src) continue;
    
    if (!src.startsWith('http://') && !src.startsWith('https://')) {
      try {
        let file;
        
        if (src.startsWith('app://local/')) {
          const localPath = decodeURIComponent(src.replace('app://local/', ''));
          file = app.vault.getAbstractFileByPath(localPath);
        } else if (src.startsWith('file:///')) {
          const localPath = decodeURIComponent(src.replace('file:///', ''));
          const files = app.vault.getAllFiles();
          file = files.find(f => f.path === localPath || f.path.endsWith(localPath));
        } else {
          file = app.metadataCache.getFirstLinkpathDest(src, activeFile.path);
        }
        
        if (file && file instanceof TFile) {
          src = app.vault.getResourcePath(file);
          img.setAttribute('src', src);
        }
      } catch (error) {
        console.error('处理图片路径失败:', error);
      }
    }
  }
  
  return tempDiv.innerHTML;
}

export function beautifyContentForWechat(htmlContent) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  tempDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  tempDiv.style.lineHeight = '1.75';
  tempDiv.style.color = '#333';
  tempDiv.style.fontSize = '16px';
  
  const paragraphs = tempDiv.querySelectorAll('p');
  paragraphs.forEach(p => {
    p.style.margin = '0 0 18px 0';
    p.style.textIndent = '0';
    p.style.lineHeight = '1.8';
  });
  
  const h1s = tempDiv.querySelectorAll('h1');
  h1s.forEach(h1 => {
    h1.style.margin = '30px 0 15px';
    h1.style.fontSize = '24px';
    h1.style.fontWeight = '700';
    h1.style.color = '#333';
    h1.style.textAlign = 'center';
    h1.style.lineHeight = '1.4';
  });
  
  const h2s = tempDiv.querySelectorAll('h2');
  h2s.forEach(h2 => {
    h2.style.margin = '28px 0 12px';
    h2.style.fontSize = '20px';
    h2.style.fontWeight = '700';
    h2.style.color = '#333';
    h2.style.borderBottom = '1px solid #eee';
    h2.style.paddingBottom = '8px';
  });
  
  const h3s = tempDiv.querySelectorAll('h3');
  h3s.forEach(h3 => {
    h3.style.margin = '25px 0 10px';
    h3.style.fontSize = '18px';
    h3.style.fontWeight = '600';
    h3.style.color = '#333';
  });
  
  const h4s = tempDiv.querySelectorAll('h4');
  h4s.forEach(h4 => {
    h4.style.margin = '20px 0 8px';
    h4.style.fontSize = '16px';
    h4.style.fontWeight = '600';
    h4.style.color = '#333';
  });
  
  const images = tempDiv.querySelectorAll('img');
  images.forEach(img => {
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.margin = '15px auto';
    img.style.display = 'block';
    img.style.borderRadius = '4px';
    img.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    img.style.background = '#fff';
    img.style.padding = '4px';
    img.style.border = '1px solid #eee';
    
    const parent = img.parentElement;
    if (parent.tagName !== 'P') {
      parent.style.textAlign = 'center';
    }
  });
  
  const links = tempDiv.querySelectorAll('a');
  links.forEach(a => {
    a.style.color = '#1AAD19';
    a.style.textDecoration = 'none';
    a.style.borderBottom = '1px solid rgba(26, 173, 25, 0.3)';
    a.target = '_blank';
  });
  
  const uls = tempDiv.querySelectorAll('ul');
  uls.forEach(ul => {
    ul.style.margin = '18px 0';
    ul.style.paddingLeft = '28px';
    ul.style.listStyleType = 'disc';
  });
  
  const ols = tempDiv.querySelectorAll('ol');
  ols.forEach(ol => {
    ol.style.margin = '18px 0';
    ol.style.paddingLeft = '28px';
    ol.style.listStyleType = 'decimal';
  });
  
  const listItems = tempDiv.querySelectorAll('li');
  listItems.forEach(li => {
    li.style.marginBottom = '8px';
    li.style.lineHeight = '1.8';
  });
  
  const preBlocks = tempDiv.querySelectorAll('pre');
  preBlocks.forEach(pre => {
    pre.style.margin = '18px 0';
    pre.style.padding = '15px';
    pre.style.background = '#f8f8f8';
    pre.style.borderRadius = '6px';
    pre.style.overflowX = 'auto';
    pre.style.fontFamily = '"Consolas", "Monaco", "Courier New", monospace';
    pre.style.fontSize = '14px';
    pre.style.lineHeight = '1.6';
    pre.style.border = '1px solid #eee';
  });
  
  const codes = tempDiv.querySelectorAll('code:not(pre code)');
  codes.forEach(code => {
    code.style.background = '#f5f5f5';
    code.style.padding = '3px 6px';
    code.style.borderRadius = '3px';
    code.style.fontFamily = '"Consolas", "Monaco", monospace';
    code.style.fontSize = '0.9em';
  });
  
  const blockquotes = tempDiv.querySelectorAll('blockquote');
  blockquotes.forEach(quote => {
    quote.style.margin = '18px 0';
    quote.style.padding = '15px 20px';
    quote.style.borderLeft = '4px solid #07C160';
    quote.style.background = '#f9f9f9';
    quote.style.color = '#666';
    quote.style.fontSize = '15px';
    quote.style.borderRadius = '0 4px 4px 0';
  });
  
  const tables = tempDiv.querySelectorAll('table');
  tables.forEach(table => {
    table.style.margin = '18px 0';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '14px';
  });
  
  const tableCells = tempDiv.querySelectorAll('td, th');
  tableCells.forEach(cell => {
    cell.style.padding = '10px 12px';
    cell.style.border = '1px solid #ddd';
    cell.style.textAlign = 'left';
  });
  
  const tableHeaders = tempDiv.querySelectorAll('th');
  tableHeaders.forEach(header => {
    header.style.backgroundColor = '#f5f5f5';
    header.style.fontWeight = '600';
    header.style.color = '#333';
  });
  
  const hr = tempDiv.querySelectorAll('hr');
  hr.forEach(line => {
    line.style.margin = '25px 0';
    line.style.border = 'none';
    line.style.borderTop = '1px solid #eee';
  });
  
  return tempDiv.innerHTML;
}
