from flask import Flask, request, redirect, url_for, send_from_directory, render_template_string
import os
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = "uploads"
ALLOWED_EXT = {"nrf", "zip", "exe"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

HTML = """
<!DOCTYPE html>
<html>
<head>
<title>NODe Upload Center</title>
<style>
    body { font-family: Arial; background:#111; color:#eee; padding:20px; }
    .file { background:#222; padding:12px; border-radius:8px; margin:10px 0; }
    a { color:#6cf; }
</style>
</head>
<body>
<h1>NODe Game Uploads</h1>

<h2>Upload a game (.nrf)</h2>
<form action="/upload" method="POST" enctype="multipart/form-data">
    <input type="file" name="file" required>
    <button type="submit">Upload</button>
</form>

<h2>Uploaded Games</h2>
{% for f in files %}
<div class="file">
    <strong>{{f}}</strong><br>
    <a href="/download/{{f}}">Download</a>
</div>
{% endfor %}
</body>
</html>
"""

@app.route("/")
def index():
    files = os.listdir(app.config["UPLOAD_FOLDER"])
    return render_template_string(HTML, files=files)

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files["file"]
    filename = secure_filename(file.filename)
    if filename.split(".")[-1].lower() not in ALLOWED_EXT:
        return "Invalid file type."
    file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
    return redirect(url_for("index"))

@app.route("/download/<filename>")
def download(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
