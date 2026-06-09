from pathlib import Path


path = Path("app/main.py")
text = path.read_text()

import_line = "from app.mvp10_timesheets_router import router as mvp10_timesheets_router"
include_line = "app.include_router(mvp10_timesheets_router)"

if import_line not in text:
    marker = "from app.mvp6_refinement_router import router as mvp6_refinement_router"
    if marker in text:
        text = text.replace(marker, marker + "\n" + import_line)
    else:
        text = import_line + "\n" + text

if include_line not in text:
    marker = "app.include_router(mvp6_refinement_router)"
    if marker in text:
        text = text.replace(marker, marker + "\n" + include_line)
    else:
        text = text.rstrip() + "\n\n" + include_line + "\n"

path.write_text(text)
print("MVP 10 router has been wired into app/main.py.")