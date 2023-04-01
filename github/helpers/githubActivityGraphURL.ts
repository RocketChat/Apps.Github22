export function githubActivityGraphUrl(username: string): string {
    /*
        We are using this project as a dependent project to generate our contribution graph image
        for our GitHub profile! https://github-readme-activity-graph.cyclic.app/graph
        The project can be found at :- https://github.com/Ashutosh00710/github-readme-activity-graph
    */
    const baseUrl = "https://github-readme-activity-graph.cyclic.app/graph";
    let url = new URL(baseUrl);

    url.searchParams.append("user_name", username);
    url.searchParams.append("bg_color", "ffffff");
    url.searchParams.append("color", "708090");
    url.searchParams.append("line", "24292e");
    url.searchParams.append("area", "true");
    url.searchParams.append("hide_border", "true");
    url.searchParams.append("&point", "24292e");

    return url.toString();
}
