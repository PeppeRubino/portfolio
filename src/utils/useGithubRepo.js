// src/hooks/useGithubRepo.js
import { useEffect, useState } from "react";
import { fetchGithubProjectData } from "../utils/github_info.jsx";

export function useGithubRepo(project = null, githubToken = null) {
  const [state, setState] = useState({
    languageBytes: project?.languageBytes || {},
    languages: project?.languages || {},
    modules: project?.modules || [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!project) return;
      // if project already has meaningful data, skip network fetch
      const hasLangs = project.languages && Object.keys(project.languages).length > 0;
      const hasModules = project.modules && project.modules.length > 0;
      if (hasLangs && hasModules) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }

      setState({ languageBytes: {}, languages: {}, modules: [], loading: true, error: null });

      try {
        const languagesUrl = project.languagesUrl || project.languages_url || null;
        const treeUrl = project.treeUrl || project.tree_url || null;
        const data = await fetchGithubProjectData({ languagesUrl, treeUrl, githubToken });
        if (!mounted) return;
        setState({
          languageBytes: data.languageBytes || {},
          languages: data.languages || {},
          modules: data.modules || [],
          loading: false,
          error: null,
        });
      } catch (err) {
        if (!mounted) return;
        setState((s) => ({ ...s, loading: false, error: err.message || String(err) }));
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [project, githubToken]);

  return state;
}
