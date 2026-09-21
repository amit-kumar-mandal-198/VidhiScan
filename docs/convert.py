import markdown
import sys

with open("Project_Architecture_and_Pitch.md", "r", encoding="utf-8") as f:
    text = f.read()

html_content = markdown.markdown(text)

styled_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>VidhiScan - Project Architecture & Pitch Blueprint</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
            background: #f9f9f9;
        }}
        .container {{
            background: #fff;
            padding: 50px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}
        h1 {{ color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }}
        h2 {{ color: #2b6cb0; margin-top: 30px; }}
        h3 {{ color: #2c5282; }}
        ul {{ padding-left: 20px; }}
        li {{ margin-bottom: 10px; }}
        em {{ background: #ebf8ff; padding: 2px 4px; border-radius: 4px; }}
        strong {{ color: #2d3748; }}
        hr {{ border: 0; height: 1px; background: #e2e8f0; margin: 30px 0; }}
        @media print {{
            body {{ background: white; }}
            .container {{ box-shadow: none; padding: 0; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        {html_content}
    </div>
</body>
</html>
"""

with open("Project_Architecture_and_Pitch.html", "w", encoding="utf-8") as f:
    f.write(styled_html)

print("HTML created successfully.")
