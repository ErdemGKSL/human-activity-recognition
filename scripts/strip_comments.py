#!/usr/bin/env python3
"""Kaynak dosyalardan yorumları (ve Python docstring'lerini) temizler.

Teslim paketindeki kod zip'i için kullanılır (scripts/make_submission.py); depodaki dosyalara dokunmaz.
Python için temizleme AST ile doğrulanabilir: strip_python(src) çıktısı, docstring'leri çıkarılmış özgün
AST ile aynı olmalıdır (bkz. python_ast_equal).
"""
import ast
import io
import re
import tokenize


def _blank_collapse(lines):
    out, prev_blank = [], True
    for ln in lines:
        ln = ln.rstrip()
        blank = ln == ""
        if blank and prev_blank:
            continue
        out.append(ln)
        prev_blank = blank
    while out and out[-1] == "":
        out.pop()
    return "\n".join(out) + "\n"


def _docstring_nodes(tree):
    for node in ast.walk(tree):
        if isinstance(node, (ast.Module, ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)):
            b = node.body
            if b and isinstance(b[0], ast.Expr) and isinstance(b[0].value, ast.Constant) and isinstance(b[0].value.value, str):
                yield node, b[0]


def _without_docstrings(tree):
    """Docstring'leri çıkarılmış AST (gövde boş kalırsa pass), karşılaştırma için."""
    for node, doc in list(_docstring_nodes(tree)):
        node.body = [n for n in node.body if n is not doc] or [ast.Pass()]
    return tree


def strip_python(src: str) -> str:
    tree = ast.parse(src)
    lines = src.split("\n")
    # 1) docstring'ler: satır aralığını alttan yukarı sil, gövde boş kalırsa 'pass' koy
    docs = sorted(((d.lineno, d.end_lineno, node, d) for node, d in _docstring_nodes(tree)), reverse=True)
    for start, end, node, d in docs:
        indent = " " * d.col_offset
        only = len(node.body) == 1
        lines[start - 1:end] = [indent + "pass"] if only else []
    src2 = "\n".join(lines)
    # 2) yorumlar: tokenize ile konumları bul, satırın o kısmını kes
    cuts = {}
    for tok in tokenize.generate_tokens(io.StringIO(src2).readline):
        if tok.type == tokenize.COMMENT:
            cuts[tok.start[0]] = tok.start[1]
    out = []
    for i, ln in enumerate(src2.split("\n"), 1):
        if i in cuts:
            ln = ln[:cuts[i]]
            if ln.strip() == "":
                continue
        out.append(ln)
    return _blank_collapse(out)


def python_ast_equal(original: str, stripped: str) -> bool:
    return ast.dump(_without_docstrings(ast.parse(original))) == ast.dump(ast.parse(stripped))


def strip_c_like(src: str) -> str:
    """Kotlin/Gradle KTS: // ve (iç içe) /* */ yorumları; dize ve karakter sabitleri korunur."""
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if src.startswith('"""', i):
            j = src.find('"""', i + 3)
            j = n if j < 0 else j + 3
            out.append(src[i:j]); i = j
        elif c == '"':
            j = i + 1
            while j < n and src[j] != '"':
                j += 2 if src[j] == "\\" else 1
            out.append(src[i:j + 1]); i = j + 1
        elif c == "'":
            j = i + 1
            while j < n and src[j] != "'":
                j += 2 if src[j] == "\\" else 1
            out.append(src[i:j + 1]); i = j + 1
        elif src.startswith("//", i):
            j = src.find("\n", i)
            i = n if j < 0 else j
        elif src.startswith("/*", i):
            depth, j = 1, i + 2
            while j < n and depth:
                if src.startswith("/*", j):
                    depth += 1; j += 2
                elif src.startswith("*/", j):
                    depth -= 1; j += 2
                else:
                    j += 1
            i = j
        else:
            out.append(c); i += 1
    return _blank_collapse("".join(out).split("\n"))


def strip_shell(src: str) -> str:
    """sh: tırnak dışında, boşluktan sonra gelen veya satır başındaki # yorumları (shebang korunur)."""
    out = []
    for k, ln in enumerate(src.split("\n")):
        if k == 0 and ln.startswith("#!"):
            out.append(ln); continue
        q, res = None, []
        for j, c in enumerate(ln):
            if q:
                res.append(c)
                if c == q:
                    q = None
            elif c in "\"'":
                q = c; res.append(c)
            elif c == "#" and (j == 0 or ln[j - 1].isspace()):
                break
            else:
                res.append(c)
        s = "".join(res)
        if s.strip() == "" and ln.strip() != "":
            continue
        out.append(s)
    return _blank_collapse(out)


def strip_hash_lines(src: str) -> str:
    """properties/toml: yalnızca '#' ile başlayan satırlar."""
    return _blank_collapse([ln for ln in src.split("\n") if not ln.lstrip().startswith("#")])


def strip_xml(src: str) -> str:
    return _blank_collapse(re.sub(r"<!--.*?-->", "", src, flags=re.S).split("\n"))


def strip_bat(src: str) -> str:
    return _blank_collapse([ln for ln in src.replace("\r\n", "\n").split("\n") if not re.match(r"\s*(@?rem\b|::)", ln, re.I)])


def strip_file(name: str, data: bytes) -> bytes:
    """Dosya türüne göre temizler; tanınmayan türler (jar, json) aynen döner."""
    low = name.lower()
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        return data
    if low.endswith(".py"):
        res = strip_python(text)
        assert python_ast_equal(text, res), f"{name}: temizleme AST'yi değiştirdi"
        return res.encode()
    if low.endswith((".kt", ".kts", ".gradle")):
        return strip_c_like(text).encode()
    if low.endswith(".xml"):
        return strip_xml(text).encode()
    if low.endswith(".sh") or low.rsplit("/", 1)[-1] == "gradlew":
        return strip_shell(text).encode()
    if low.endswith(".bat"):
        return strip_bat(text).replace("\n", "\r\n").encode()
    if low.endswith((".properties", ".toml")):
        return strip_hash_lines(text).encode()
    return data
