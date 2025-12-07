import { useEffect, useState } from "react";
import { toApiRepoUrl } from "./utils.js";

export default function useGithubMetadata(project, githubToken) {
  const [languages, setLanguages] = useState({});
  const [languageBytes, setLanguageBytes] = useState({});
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [repoCreatedAt, setRepoCreatedAt] = useState(null);
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState(null);

  useEffect(() => {
    let abort = false;
    const controller = new AbortController();

    async function fetchRepoMeta() {
      setRepoError(null);
      setRepoCreatedAt(null);
      if (!project) return;

      const rawUrl = project.repository || project.repositoryUrl || project.repo || null;
      const apiUrl = toApiRepoUrl(rawUrl);
      if (!apiUrl) return;

      setRepoLoading(true);
      try {
        const headers = { Accept: "application/vnd.github+json" };
        if (githubToken) headers.Authorization = `token ${githubToken}`;

        const res = await fetch(apiUrl, { signal: controller.signal, headers });
        if (abort) return;
        if (!res.ok) {
          setRepoError(`GitHub API non OK: ${res.status}`);
          return;
        }
        const data = await res.json().catch(() => null);
        if (data?.created_at) {
          setRepoCreatedAt(data.created_at);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setRepoError(err.message || String(err));
        }
      } finally {
        if (!abort) setRepoLoading(false);
      }
    }

    fetchRepoMeta();
    return () => {
      abort = true;
      controller.abort();
    };
  }, [project, githubToken]);

  useEffect(() => {
    let abort = false;
    const controller = new AbortController();

    async function fetchLanguages() {
      setError(null);
      setLanguages({});
      setLanguageBytes({});
      setModules(project?.modules || []);

      if (!project) {
        setLoading(false);
        return;
      }

      const rawUrl = project.repository || project.repositoryUrl || project.repo || null;
      const apiUrl = toApiRepoUrl(rawUrl);
      if (!apiUrl) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const headers = { Accept: "application/vnd.github+json" };
        if (githubToken) headers.Authorization = `token ${githubToken}`;

        const res = await fetch(`${apiUrl}/languages`, { signal: controller.signal, headers });
        if (abort) return;

        if (!res.ok) {
          setError(`GitHub API non OK: ${res.status}`);
          return;
        }

        const data = await res.json().catch(() => ({}));
        setLanguages(data);
        setLanguageBytes(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || String(err));
        }
      } finally {
        if (!abort) setLoading(false);
      }
    }

    fetchLanguages();
    return () => {
      abort = true;
      controller.abort();
    };
  }, [project, githubToken]);

  return {
    languages,
    languageBytes,
    modules,
    loading,
    error,
    repoCreatedAt,
    repoLoading,
    repoError,
  };
}
