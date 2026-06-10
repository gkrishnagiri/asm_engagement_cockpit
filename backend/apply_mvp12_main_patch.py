from pathlib import Path


path = Path("app/main.py")
text = path.read_text()

import_line = "from app.mvp12_recommendation_management_router import router as mvp12_recommendation_management_router"
include_line = "app.include_router(mvp12_recommendation_management_router)"

if import_line not in text:
    marker = "from app.mvp11_review_workflow_router import router as mvp11_review_workflow_router"
    if marker in text:
        text = text.replace(marker, marker + "\n" + import_line)
    else:
        text = import_line + "\n" + text

if include_line not in text:
    marker = "app.include_router(mvp11_review_workflow_router)"
    if marker in text:
        text = text.replace(marker, marker + "\n" + include_line)
    else:
        text = text.rstrip() + "\n\n" + include_line + "\n"

path.write_text(text)
print("MVP 12 router has been wired into app/main.py.")