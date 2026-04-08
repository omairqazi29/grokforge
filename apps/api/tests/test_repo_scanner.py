import os
import tempfile
import pytest

from app.services.repo_scanner import RepoScanner


class TestRepoScanner:
    def test_scan_empty_dir(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            scanner = RepoScanner()
            result = scanner.scan(tmpdir)
            assert result.name == os.path.basename(tmpdir)
            assert result.file_tree == []
            assert result.symbol_index == {}

    def test_scan_with_files(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            (open(os.path.join(tmpdir, "main.py"), "w")).write("def hello():\n    pass\n")
            (open(os.path.join(tmpdir, "utils.py"), "w")).write("class Helper:\n    pass\n")

            scanner = RepoScanner()
            result = scanner.scan(tmpdir)
            assert "main.py" in result.file_tree
            assert "utils.py" in result.file_tree
            assert "main.py" in result.symbol_index
            assert "hello" in result.symbol_index["main.py"]
            assert "Helper" in result.symbol_index["utils.py"]

    def test_ignores_git_dir(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            git_dir = os.path.join(tmpdir, ".git")
            os.makedirs(git_dir)
            (open(os.path.join(git_dir, "config"), "w")).write("git config")
            (open(os.path.join(tmpdir, "app.py"), "w")).write("")

            scanner = RepoScanner()
            result = scanner.scan(tmpdir)
            assert "app.py" in result.file_tree
            assert not any(".git" in f for f in result.file_tree)

    def test_ignores_binary_extensions(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            (open(os.path.join(tmpdir, "image.png"), "w")).write("")
            (open(os.path.join(tmpdir, "app.py"), "w")).write("")

            scanner = RepoScanner()
            result = scanner.scan(tmpdir)
            assert "app.py" in result.file_tree
            assert "image.png" not in result.file_tree

    def test_sample_files_populated(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            content = "print('hello world')"
            (open(os.path.join(tmpdir, "main.py"), "w")).write(content)

            scanner = RepoScanner()
            result = scanner.scan(tmpdir)
            assert "main.py" in result.sample_files
            assert result.sample_files["main.py"] == content

    def test_invalid_path_raises(self):
        scanner = RepoScanner()
        with pytest.raises(ValueError):
            scanner.scan("/nonexistent/path/that/does/not/exist")
