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

export const themes = {
  default: {
    name: '默认',
    h1: '#333333',
    h2: '#333333',
    h3: '#333333',
    h4: '#333333',
    h5: '#333333',
    h6: '#333333',
    link: '#1AAD19',
    linkHover: 'rgba(26, 173, 25, 0.1)',
    primary: '#07C160'
  },
  simple: {
    name: '简约',
    h1: '#333333',
    h2: '#333333',
    h3: '#333333',
    h4: '#333333',
    h5: '#333333',
    h6: '#333333',
    link: '#333333',
    linkHover: 'rgba(51, 51, 51, 0.1)',
    primary: '#333333'
  },
  elegant: {
    name: '优雅',
    h1: '#8B4513',
    h2: '#8B4513',
    h3: '#8B4513',
    h4: '#8B4513',
    h5: '#8B4513',
    h6: '#8B4513',
    link: '#8B4513',
    linkHover: 'rgba(139, 69, 19, 0.1)',
    primary: '#8B4513'
  },
  tech: {
    name: '科技',
    h1: '#00BFFF',
    h2: '#00BFFF',
    h3: '#00BFFF',
    h4: '#00BFFF',
    h5: '#00BFFF',
    h6: '#00BFFF',
    link: '#00BFFF',
    linkHover: 'rgba(0, 191, 255, 0.1)',
    primary: '#00BFFF'
  },
  warm: {
    name: '温暖',
    h1: '#FF6B6B',
    h2: '#FF6B6B',
    h3: '#FF6B6B',
    h4: '#FF6B6B',
    h5: '#FF6B6B',
    h6: '#FF6B6B',
    link: '#FF6B6B',
    linkHover: 'rgba(255, 107, 107, 0.1)',
    primary: '#FF6B6B'
  },
  fresh: {
    name: '清新',
    h1: '#4ECDC4',
    h2: '#4ECDC4',
    h3: '#4ECDC4',
    h4: '#4ECDC4',
    h5: '#4ECDC4',
    h6: '#4ECDC4',
    link: '#4ECDC4',
    linkHover: 'rgba(78, 205, 196, 0.1)',
    primary: '#4ECDC4'
  },
  business: {
    name: '商务',
    h1: '#1E3A8A',
    h2: '#1E3A8A',
    h3: '#1E3A8A',
    h4: '#1E3A8A',
    h5: '#1E3A8A',
    h6: '#1E3A8A',
    link: '#1E3A8A',
    linkHover: 'rgba(30, 58, 138, 0.1)',
    primary: '#1E3A8A'
  }
};

export function applyTheme(container, themeName) {
  const theme = themes[themeName] || themes.default;
  
  const h1s = container.querySelectorAll('h1');
  h1s.forEach(h1 => {
    h1.style.color = theme.h1;
  });
  
  const h2s = container.querySelectorAll('h2');
  h2s.forEach(h2 => {
    h2.style.color = theme.h2;
  });
  
  const h3s = container.querySelectorAll('h3');
  h3s.forEach(h3 => {
    h3.style.color = theme.h3;
  });
  
  const h4s = container.querySelectorAll('h4');
  h4s.forEach(h4 => {
    h4.style.color = theme.h4;
  });
  
  const h5s = container.querySelectorAll('h5');
  h5s.forEach(h5 => {
    h5.style.color = theme.h5;
  });
  
  const h6s = container.querySelectorAll('h6');
  h6s.forEach(h6 => {
    h6.style.color = theme.h6;
  });
  
  const links = container.querySelectorAll('a');
  links.forEach(a => {
    a.style.color = theme.link;
    a.style.borderBottomColor = theme.linkHover;
  });
  
  const blockquotes = container.querySelectorAll('blockquote');
  blockquotes.forEach(quote => {
    quote.style.borderLeftColor = theme.primary;
  });
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

export function beautifyContentForWechat(htmlContent, themeName = 'default') {
  const theme = themes[themeName] || themes.default;
  
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
    p.style.color = '#333';
  });
  
  const h1s = tempDiv.querySelectorAll('h1');
  h1s.forEach(h1 => {
    h1.style.margin = '30px 0 15px';
    h1.style.fontSize = '24px';
    h1.style.fontWeight = '700';
    h1.style.color = theme.h1;
    h1.style.textAlign = 'center';
    h1.style.lineHeight = '1.4';
  });
  
  const h2s = tempDiv.querySelectorAll('h2');
  h2s.forEach(h2 => {
    h2.style.margin = '28px 0 12px';
    h2.style.fontSize = '20px';
    h2.style.fontWeight = '700';
    h2.style.color = theme.h2;
    h2.style.borderBottom = '1px solid #eee';
    h2.style.paddingBottom = '8px';
  });
  
  const h3s = tempDiv.querySelectorAll('h3');
  h3s.forEach(h3 => {
    h3.style.margin = '25px 0 10px';
    h3.style.fontSize = '18px';
    h3.style.fontWeight = '600';
    h3.style.color = theme.h3;
  });
  
  const h4s = tempDiv.querySelectorAll('h4');
  h4s.forEach(h4 => {
    h4.style.margin = '20px 0 8px';
    h4.style.fontSize = '16px';
    h4.style.fontWeight = '600';
    h4.style.color = theme.h4;
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
    a.style.color = theme.link;
    a.style.textDecoration = 'none';
    a.style.borderBottom = `1px solid ${theme.linkHover}`;
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
    quote.style.borderLeft = `4px solid ${theme.primary}`;
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

export function applyFormatOptions(htmlContent, formatOptions) {
  if (!formatOptions.enabled) {
    return htmlContent;
  }
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  if (formatOptions.removeExtraBreaks) {
    const allElements = tempDiv.querySelectorAll('*');
    
    allElements.forEach(el => {
      const childNodes = Array.from(el.childNodes);
      for (let i = 0; i < childNodes.length - 1; i++) {
        const current = childNodes[i];
        const next = childNodes[i + 1];
        if (current.nodeType === Node.TEXT_NODE && next.nodeType === Node.TEXT_NODE) {
          const combined = current.textContent + next.textContent;
          if (/\n{2,}/.test(combined)) {
            current.textContent = combined.replace(/\n{2,}/g, '\n');
            next.remove();
          }
        }
      }
      
      if (el.nodeType === Node.TEXT_NODE) {
        el.textContent = el.textContent.replace(/\n{2,}/g, '\n');
      }
    });
    
    const brElements = Array.from(tempDiv.querySelectorAll('br'));
    for (let i = brElements.length - 1; i >= 0; i--) {
      const br = brElements[i];
      const nextElement = br.nextElementSibling;
      const nextSibling = br.nextSibling;
      
      if ((nextElement && nextElement.tagName === 'BR') || 
          (nextSibling && nextSibling.nodeType === Node.ELEMENT_NODE && nextSibling.tagName === 'BR')) {
        br.remove();
      }
    }
    
    const emptyParagraphs = Array.from(tempDiv.querySelectorAll('p, div'));
    const toRemove = new Set();
    
    for (let i = 0; i < emptyParagraphs.length; i++) {
      const p = emptyParagraphs[i];
      if (p.textContent.trim() !== '' || p.children.length > 0) {
        continue;
      }
      
      const prev = p.previousElementSibling;
      const next = p.nextElementSibling;
      
      const prevIsEmpty = prev && (prev.tagName === 'P' || prev.tagName === 'DIV') && 
                         prev.textContent.trim() === '' && prev.children.length === 0;
      const nextIsEmpty = next && (next.tagName === 'P' || next.tagName === 'DIV') && 
                         next.textContent.trim() === '' && next.children.length === 0;
      
      if (prevIsEmpty || nextIsEmpty) {
        toRemove.add(p);
      }
    }
    
    toRemove.forEach(el => el.remove());
  }
  
  if (formatOptions.paragraphSpacing) {
    const paragraphs = tempDiv.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.style.marginBottom = '18px';
      p.style.lineHeight = '1.8';
    });
  }
  
  if (formatOptions.unifyHeadings) {
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingStyles = {
      h1: { fontSize: '24px', margin: '30px 0 15px', weight: '700' },
      h2: { fontSize: '20px', margin: '28px 0 12px', weight: '700' },
      h3: { fontSize: '18px', margin: '25px 0 10px', weight: '600' },
      h4: { fontSize: '16px', margin: '20px 0 8px', weight: '600' },
      h5: { fontSize: '15px', margin: '18px 0 8px', weight: '600' },
      h6: { fontSize: '14px', margin: '16px 0 6px', weight: '600' }
    };
    
    headings.forEach(h => {
      const tag = h.tagName.toLowerCase();
      const style = headingStyles[tag];
      if (style) {
        h.style.fontSize = style.fontSize;
        h.style.margin = style.margin;
        h.style.fontWeight = style.weight;
        h.style.lineHeight = '1.4';
      }
    });
  }
  
  if (formatOptions.optimizeImages) {
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
  }
  
  if (formatOptions.quoteStyle) {
    const blockquotes = tempDiv.querySelectorAll('blockquote');
    blockquotes.forEach(quote => {
      quote.style.margin = '18px 0';
      quote.style.padding = '15px 20px';
      quote.style.borderLeft = '4px solid #576b95';
      quote.style.background = '#f9f9f9';
      quote.style.color = '#666';
      quote.style.fontSize = '15px';
      quote.style.borderRadius = '0 4px 4px 0';
    });
  }
  
  if (formatOptions.codeBlockStyle) {
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
  }
  
  if (formatOptions.listFormat) {
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
  }
  
  return tempDiv.innerHTML;
}
