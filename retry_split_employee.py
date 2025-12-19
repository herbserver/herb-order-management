import os

PANEL_FILE = 'views/partials/employee_panel.ejs'
TABS_DIR = 'views/partials/employee_tabs'

# Ensure directory exists
if not os.path.exists(TABS_DIR):
    os.makedirs(TABS_DIR)
    print(f"Created directory: {TABS_DIR}")

# The tabs we want to extract
TABS = [
    {'id': 'empOrderTab', 'file': 'order_tab.ejs'},
    {'id': 'empTrackingTab', 'file': 'tracking_tab.ejs'},
    {'id': 'empHistoryTab', 'file': 'history_tab.ejs'},
    {'id': 'empProgressTab', 'file': 'progress_tab.ejs'},
    {'id': 'empCancelledTab', 'file': 'cancelled_tab.ejs'}
]

with open(PANEL_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

def extract_div_by_id(html, div_id):
    # Find start
    start_pattern = f'<div id="{div_id}"'
    start_idx = html.find(start_pattern)
    if start_idx == -1:
        print(f"⚠️ Could not find div with id='{div_id}'")
        return None, None
    
    # Find end with balanced tags
    idx = start_idx
    open_tags = 0
    search_limit = len(html)
    
    while idx < search_limit:
        if html[idx:idx+4] == '<div':
            open_tags += 1
            idx += 4
        elif html[idx:idx+5] == '</div>':
            open_tags -= 1
            idx += 5
            if open_tags == 0:
                return start_idx, idx
        else:
            idx += 1
            
    print(f"⚠️ Could not find closing tag for '{div_id}'")
    return None, None

new_content = content
extracted_count = 0

for tab in TABS:
    # First check if the file already exists and is not empty
    tab_path = os.path.join(TABS_DIR, tab['file'])
    
    # Extract content
    s, e = extract_div_by_id(content, tab['id'])
    
    if s is not None:
        extracted_html = content[s:e]
        
        # Write to file
        with open(tab_path, 'w', encoding='utf-8') as f:
            f.write(extracted_html)
        print(f"✅ Extracted {tab['id']} to {tab['file']}")
        
        # Replace in content
        # We replace the EXACT extracted string
        include_tag = f"            <%- include('../employee_tabs/{tab['file'].replace('.ejs','')}') %>"
        new_content = new_content.replace(extracted_html, include_tag)
        extracted_count += 1
    else:
        # Maybe it was already replaced? Check if include exists
        if f"include('../employee_tabs/{tab['file'].replace('.ejs','')}')" in content:
            print(f"ℹ️ {tab['id']} seems to be already replaced.")
        else:
            print(f"❌ Failed to process {tab['id']}")

if extracted_count > 0:
    with open(PANEL_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"🎉 Updated {PANEL_FILE} with {extracted_count} includes.")
else:
    print("ℹ️ No changes made to main file.")
