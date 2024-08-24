"use client";
import { useState, useEffect } from "react";
const apiDomain = "http://localhost:3001";
import Loading from "./loading";

export default function Result() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [tableData, setTableData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [success, setSuccess] = useState("");
  const [messageContent, setMessageContent] = useState({});

  const clearErrors = () => {
    setTimeout(() => {
      setError("");
    }, 6000);
  };
  useEffect(() => {
    getResultData();
  }, []);

  function clearTable() {
    const tableBody = document.querySelector("tbody");
    const tableHead = document.querySelector("thead");
    if (tableBody == null) {
      return;
    }
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";
  }

  function addTitle(div, selectedButton) {
    let hoverTimeout;
    if (div.hasAttribute("data-title-listeners")) {
      return;
    }

    div.classList.remove("border", "border-gray-300");
    const insideDiv = div.querySelector("div");
    insideDiv.classList.add("hidden");
    const label = div.querySelector("label");
    const originalText = label.textContent;
    label.textContent = `${originalText}: ${selectedButton}`;

    div.addEventListener("mouseenter", function (event) {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        div.classList.add("border", "border-gray-300");
        insideDiv.classList.remove("hidden");
        label.textContent = originalText;
      }, 90);
    });

    div.addEventListener("mouseleave", function (event) {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        div.classList.remove("border", "border-gray-300");
        insideDiv.classList.add("hidden");
        label.textContent = `${originalText}: ${selectedButton}`;
      }, 0);
    });

    div.setAttribute("data-title-listeners", "true");
  }

  const getResultData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiDomain}/api/csa/gesData`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const selectStage = document.getElementById("stage");
      const selectGroup = document.getElementById("group");
      const selectMatch = document.getElementById("match");
      const eventDiv = document.getElementById("eventDiv");
      const stageDiv = document.getElementById("stageDiv");
      const groupDiv = document.getElementById("groupDiv");
      const statsDiv = document.getElementById("statsDiv");
      const matchDiv = document.getElementById("matchDiv");
      const teamListDiv = document.getElementById("teamListDiv");

      function hideAllExcept(selectedDiv) {
        const allDivs = [
          eventDiv,
          stageDiv,
          groupDiv,
          matchDiv,
          statsDiv,
          teamListDiv,
        ];

        let startIndex = allDivs.indexOf(selectedDiv);
        if (startIndex !== -1) {
          const divsToHide = allDivs.slice(startIndex + 1);

          divsToHide.forEach((div) => {
            div.classList.add("hidden");
          });
        }
        clearTable();
      }

      if (response.ok) {
        setError("Data Retrieved !!");
        const res = await response.json();
        const { stage, group } = res.gesData;

        const stageOption = [];
        const groupOptions = [];

        const csaEventID = "66c41f2833aa084df2231abc";
        const csaStages = stage.filter((option) => option.event === csaEventID);

        csaStages.forEach((data) => {
          const option = `<button class="hover:bg-gray-700 hover:text-white py-2 mx-1 px-4 text-nowrap rounded" value="${data._id}" name="${data.event}">${data.name}</button>`;
          stageOption.push(option);
        });
        const stageOptions = [
          `<button class="hover:bg-gray-700 hover:text-white py-2 mx-1 px-4 text-nowrap rounded" value="overall" name="overall">Overall</button>`,
          ...stageOption,
        ];
        setIsLoading(false);
        selectStage.innerHTML = stageOptions.join("");

        group.forEach((data) => {
          const option = `<button class="hover:bg-gray-700 hover:text-white py-2 mx-1 px-4 text-nowrap rounded" value="${data._id}" name="${data.stage}">${data.name}</button>`;
          groupOptions.push(option);
        });

        selectStage.addEventListener("click", function (event) {
          const stageButton = selectStage.querySelectorAll("button");
          stageButton.forEach((button) =>
            button.classList.remove("bg-gray-700", "text-white")
          );

          const stageE = event.target;
          const stageId = stageE.value;
          const stageName = stageE.textContent;
          const stageInfo = stage.find((s) => s._id === stageId);
          stageE.classList.add("bg-gray-700", "text-white");

          setMessageContent(prevContent => ({
            ...prevContent,
            stage: stageName
          }));
          addTitle(stageDiv, stageName);
          hideAllExcept(stageDiv);
          const matchData = group.reduce((acc, curr) => {
            if (curr.stage === stageId) {
              acc[curr._id] = curr.matches;
            }
            return acc;
          }, {});
          if (stageId === "overall") {
            let stageIds = [];
            csaStages.forEach((a) => {
              stageIds.push(a._id);
            });
            groupFun(stageIds, "Overall");
          } else if (stageInfo.groupType === "Multiple") {
            // const keyWithArray = Object.keys(matchData).find(key => matchData[key].length > 0);
            groupFun(stageId, "Multiple");
          } else if (stageInfo.groupType === "Individual") {
            const keysWithArray = Object.entries(matchData)
              .filter(([key, value]) => value.length > 0)
              .map(([key, _]) => key);
            if (keysWithArray.length > 0) {
              let filteredGroups = groupOptions.filter((option) =>
                keysWithArray.some((key) => option.includes(`value="${key}"`))
              );
              groupDiv.classList.remove("hidden");
              selectGroup.innerHTML = filteredGroups.join("");
            }
          }
        });

        let matches = [];

        selectGroup.addEventListener("click", async function (event) {
          const groupE = event.target;
          const groupId = groupE.value;
          const groupName = groupE.textContent;
          groupFun(groupId, "Individual");
          addTitle(groupDiv, groupName);
          groupE.classList.add("bg-gray-700", "text-white");
        });

        async function groupFun(id, type) {
          const groupButtons = selectGroup.querySelectorAll("button");
          groupButtons.forEach((button) =>
            button.classList.remove("bg-gray-700", "text-white")
          );

          hideAllExcept(groupDiv);
          try {
            setIsLoading(true);
            const response = await fetch(`${apiDomain}/api/csa/gesData`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            });
            if (response.ok) {
              const res = await response.json();
              const { matchData } = res.gesData;
              if (type === "Overall") {
                id.forEach((i) => {
                  const allGroups = group.filter((g) => g.stage === i);
                  const allMatches = new Set();
                  allGroups.forEach((g) => {
                    g.matches.forEach((matchId) => allMatches.add(matchId));
                  });
                  matches = matches.concat(
                    matchData.filter((match) => allMatches.has(match.id))
                  );
                });
              } else if (type === "Multiple") {
                const allGroups = group.filter((g) => g.stage === id);
                const allMatches = new Set();
                allGroups.forEach((g) => {
                  g.matches.forEach((matchId) => allMatches.add(matchId));
                });
                matches = matchData.filter((match) => allMatches.has(match.id));
              } else if (type === "Individual") {
                matches = matchData.filter((o) => o.groupId[0] === id);
              }

              const matchOptions = matches.map((data) => {
                return `<button class="hover:bg-gray-700 hover:text-white py-2 mx-1 px-4 text-nowrap rounded" value="${data.id}">Match ${data.matchNo}</button>`;
              });

              matchOptions.sort((a, b) => {
                const matchNoA = a.match(/Match (\d+)/)[1];
                const matchNoB = b.match(/Match (\d+)/)[1];
                return matchNoA - matchNoB;
              });

              const updatedOptions = [
                '<button class="hover:bg-gray-700 hover:text-white py-2 mx-1 px-4 rounded" value="Overall">Overall</button>',
                ...matchOptions,
              ];

              matchDiv.classList.remove("hidden");
              setIsLoading(false);
              selectMatch.innerHTML = updatedOptions.join("");
            }
          } catch (error) {
            console.log(error);
          }
        }

        const mvpTableDiv = document.getElementById("mvpStats");

        mvpTableDiv.addEventListener("click", async function (event) {
          const matchId = "Overall";
          const matchIds = matches.map((data) => {
            return data.id;
          });
          try {
            setIsLoading(true);
            const response = await fetch(`${apiDomain}/api/csa/topTenMvps`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                matchIds,
              }),
            });

            if (response.ok) {
              const res = await response.json();
              const playerResult = res.playerResult;
              setIsLoading(false);
              updatePlayerTable(playerResult, matchId === "Overall");
            }
          } catch (error) {
            console.log(`error: ${error}`);
          }
        });

        selectMatch.addEventListener("click", async function (event) {
          const matchButtons = selectMatch.querySelectorAll("button");
          matchButtons.forEach((button) =>
            button.classList.remove("bg-gray-700", "text-white")
          );

          const matchE = event.target;
          const matchId = matchE.value;
          const matchName = matchE.textContent;

          setMessageContent(prevContent => ({
            ...prevContent,
            match: matchName
          }));
          hideAllExcept(matchDiv);
          addTitle(matchDiv, matchName);
          matchE.classList.add("bg-gray-700", "text-white");
          statsDiv.classList.remove("hidden");
          if (matchId === "Overall") {
            const matchIds = matches.map((data) => {
              return data.id;
            });
            getOverall(matchIds);
          } else {
            try {
              setIsLoading(true);
              const response = await fetch(`${apiDomain}/api/csa/perMatchResults`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  matchId,
                }),
              });

              if (response.ok) {
                const selectStats = document.getElementById("stats");
                const afterMatch = document.getElementById("afterMatch");
                const statsValue = "teamStats";
                const res = await response.json();
                const playerResult = res.result.playerResult;
                const teamResult = res.result.teamResult;
                const teamListDiv = document.getElementById("teamListDiv");
                setIsLoading(false);
                if (statsValue === "teamStats") {
                  updateTeamTable(teamResult);
                  teamListDiv.classList.add("hidden");
                } else {
                  updatePlayerTable(playerResult);
                  teamListDiv.classList.remove("hidden");
                  updateTeamOption(teamResult);
                }
                afterMatch.addEventListener("click", function (event) {
                  const selectedMatchIndex = matches.findIndex(
                    (match) => match.id === matchId
                  );
                  if (selectedMatchIndex === -1) {
                    setError("Selected match ID not found in matches array.");
                  }
                  const afterMatchIds = matches
                    .slice(0, selectedMatchIndex + 1)
                    .map((data) => {
                      return data.id;
                    });

                  getOverall(afterMatchIds);
                });
                selectStats.addEventListener("click", function (event) {
                  const statsButtons = selectStats.querySelectorAll("button");
                  statsButtons.forEach((button) =>
                    button.classList.remove("bg-gray-700", "text-white")
                  );

                  const stageE = event.target;
                  const statsValue = stageE.value;
                  stageE.classList.add("bg-gray-700", "text-white");
                  if (statsValue === "teamStats") {
                    updateTeamTable(teamResult);
                    teamListDiv.classList.add("hidden");
                  } else if (statsValue === "playerStats") {
                    updatePlayerTable(playerResult);

                    const teamList = document.getElementById("teamList");
                    teamListDiv.classList.remove("hidden");
                    updateTeamOption(teamResult);
                  }
                });
                teamList.addEventListener("change", function (event) {
                  const teamName = event.target.value;
                  if (teamName === "all") {
                    updatePlayerTable(playerResult);
                  } else {
                    const selectedTeamData = playerResult.filter(
                      (item) => item.teamName === teamName
                    );
                    updatePlayerTable(selectedTeamData);
                  }
                });
              }
            } catch (error) {
              console.log(error);
            }
          }
          async function getOverall(matchIds) {
            try {
              setIsLoading(true);
              const response = await fetch(`${apiDomain}/api/csa/overallResults`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  matchIds,
                }),
              });

              setMessageContent(prevContent => ({
                ...prevContent,
                count: matchIds.length
              }));

              if (response.ok) {
                const selectStats = document.getElementById("stats");
                const teamList = document.getElementById("teamList");

                const statsValue = "teamStats";
                const res = await response.json();
                const playerResult = res.result.playerResult;
                const teamResult = res.result.teamResult;
                
                setIsLoading(false);
                if (statsValue === "teamStats") {
                  updateTeamTable(teamResult, matchId === "Overall");
                  teamListDiv.classList.add("hidden");
                } else {
                  updatePlayerTable(playerResult, matchId === "Overall");
                  teamListDiv.classList.remove("hidden");
                  updateTeamOption(teamResult);
                }

                selectStats.addEventListener("click", function (event) {
                  const statsButtons = selectStats.querySelectorAll("button");
                  statsButtons.forEach((button) =>
                    button.classList.remove("bg-gray-700", "text-white")
                  );

                  const stageE = event.target;
                  const statsValue = stageE.value;
                  stageE.classList.add("bg-gray-700", "text-white");
                  if (statsValue === "teamStats") {
                    updateTeamTable(teamResult, matchId === "Overall");
                    teamListDiv.classList.add("hidden");
                  } else if (statsValue === "playerStats") {
                    updatePlayerTable(playerResult, matchId === "Overall");
                    teamListDiv.classList.remove("hidden");
                    updateTeamOption(teamResult);
                  }
                });
                teamList.addEventListener("change", function (event) {
                  const teamName = event.target.value;

                  const selectedTeamData = playerResult.filter(
                    (item) => item.teamName === teamName
                  );
                  updatePlayerTable(selectedTeamData, matchId === "Overall");
                });
              }
            } catch (error) {
              console.log(`error: ${error}`);
            }
          }
        });
      } else {
        console.error("Error:", response.status, response.statusText);
        setError(`Error: ${response.status} ${response.statusText}`);
      }
      clearErrors();
    } catch (error) {
      console.error("Error:", error.message);
      setError(`Error: ${error.message}`);
      clearErrors();
    }
  };

  function updateTeamOption(teamResult) {
    const teamOptions = teamResult.map((data) => {
      return `<option value="${data.team}">${data.team}</option>`;
    });

    const updatedOptions = [
      '<option value="" selected>Select Match</option>',
      ...teamOptions,
    ];
    teamList.innerHTML = updatedOptions.join("");
  }

  function updateTeamTable(data, isOverall) {
    const tableBody = document.querySelector("tbody");
    const tableHead = document.querySelector("thead");
    if (tableBody !== null) {
      tableHead.innerHTML = "";
      tableBody.innerHTML = "";
    }

    const headers = [
      "Rank",
      "Team",
      "Tag",
      "Kills",
      "Damage",
      "Place Points",
      "Total Points",
      "WWCD",
      "Match",
      "Last Match Rank",
    ];

    const headRow = document.createElement("tr");
    headers.forEach((headerText) => {
      const th = document.createElement("th");
      th.textContent = headerText;
      th.className = "border border-black bg-amber-400 text-black px-4 py-2";
      headRow.appendChild(th);
    });

    data.forEach((item) => {
      const row = document.createElement("tr");
      if (isOverall) {
        row.innerHTML = `
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.cRank}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.team}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.tag}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.kill}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.damage}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.placePoint}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.totalPoint}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.wwcd}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.matchCount}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.lastMatchRank}</td>
            `;
      } else {
        row.innerHTML = `
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.cRank}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.team}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.tag}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.kill}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.damage}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.placePoint}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.totalPoint}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.wwcd}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.match}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.rank}</td>
            `;
      }
      tableHead.appendChild(headRow);
      tableBody.appendChild(row);
    });
    setHeaders(headers);
    const tableRows = data.map((item) => {
      return [
        item.cRank,
        item.team,
        item.tag,
        item.kill,
        item.damage,
        item.placePoint,
        item.totalPoint,
        item.wwcd,
        item.matchCount || item.match,
        item.lastMatchRank || item.rank,
      ];
    });

    setTableData(tableRows);
    tableSort();
  }

  function updatePlayerTable(data, isOverall) {
    const tableBody = document.querySelector("tbody");
    const tableHead = document.querySelector("thead");
    if (tableBody !== null) {
      tableHead.innerHTML = "";
      tableBody.innerHTML = "";
    }

    const headRow = document.createElement("tr");
    const overallHeaders = [
      "Rank",
      "Team Name",
      "In Game Name",
      "UID",
      "Kills",
      "Damage",
      "Survival Time",
      "Assists",
      "Heal",
      "Head Shot",
      "MVP Rating",
      "MP",
    ];
    const perMatchHeaders = [
      "Rank",
      "Team Name",
      "In Game Name",
      "UID",
      "Kills",
      "Damage",
      "Survival Time",
      "Assists",
      "Heal",
      "Head Shot",
    ];

    if (isOverall) {
      overallHeaders.forEach((headerText) => {
        const th = document.createElement("th");
        th.textContent = headerText;
        th.className = "border border-black bg-amber-400 text-black px-4 py-2";
        headRow.appendChild(th);
      });
    } else {
      perMatchHeaders.forEach((headerText) => {
        const th = document.createElement("th");
        th.textContent = headerText;
        th.className = "border border-black bg-amber-400 text-black px-4 py-2";
        headRow.appendChild(th);
      });
    }

    data.forEach((item) => {
      const row = document.createElement("tr");
      if (isOverall) {
        row.innerHTML = `
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.cRank}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.teamName}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.inGameName}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.uId}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.kill}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.damage}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.survivalTime}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.assist}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.heal}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.headshot}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.mvp}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.matchPlayed}</td>
            `;
      } else {
        row.innerHTML = `
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.cRank}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.teamName}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.inGameName}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.uId}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.kill}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.damage}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.survivalTime}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.assist}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.heal}</td>
                <td class="border dark:border-gray-400 dark:text-white border-black text-black px-2 py-1">${item.headshot}</td>
            `;
      }
      tableHead.appendChild(headRow);
      tableBody.appendChild(row);
    });
    tableSort();
  }
  function tableSort() {
    const headers = document.querySelectorAll("th");

    headers.forEach((header, index) => {
      header.addEventListener("click", () => {
        sortTable(header, index);
      });
    });

    function sortTable(header, columnIndex) {
      const tableBody = document.querySelector("tbody");
      const rows = Array.from(tableBody.querySelectorAll("tr"));
      let sortOrder = header.getAttribute("data-order") || "asc";

      rows.sort((rowA, rowB) => {
        const cellA = rowA
          .querySelectorAll("td")
          [columnIndex].textContent.trim();
        const cellB = rowB
          .querySelectorAll("td")
          [columnIndex].textContent.trim();

        const compareResult =
          isNaN(cellA) || isNaN(cellB)
            ? cellA.localeCompare(cellB)
            : cellA - cellB;
        return sortOrder === "asc" ? compareResult : -compareResult;
      });

      tableBody.innerHTML = "";
      rows.forEach((row) => tableBody.appendChild(row));

      sortOrder = sortOrder === "asc" ? "desc" : "asc";
      header.setAttribute("data-order", sortOrder);
    }
  }

  async function sendResult() {
    if (tableData.length === 0) {
      setError("No data to send");
      return;
    }
    const message = `${messageContent.stage} - ${messageContent.match === 'Overall' ? `After Match ${messageContent.count}` : messageContent.match}`;
    const isOverall = messageContent.match === 'Overall';
    try {
        const response = await fetch("http://localhost:3001/api/sendResult", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ tableData, headers, message, isOverall }),
        });
        if (response.ok) {
        setSuccess('Result sent');
        }
    } catch (error) {
        setError('Error sending result');
    }
  }

  return (
    <>
      <div id="body" className="flex flex-col">
        <div className="flex flex-row overflow-auto mt-2">
          <div
            id="stageDiv"
            className="flex flex-col p-2 ml-8 border border-gray-300 rounded-lg"
          >
            <label htmlFor="stage" className="underline">
              Stage
            </label>
            <div
              id="stage"
              className="flex flex-row overflow-x-auto no-scrollbar"
            >
              {/* <!-- Add stage buttons here --> */}
            </div>
          </div>

          <div
            id="groupDiv"
            className="flex flex-col p-2 ml-4 border border-gray-300 rounded-lg hidden"
          >
            <label htmlFor="group" className="underline">
              Group
            </label>
            <div
              id="group"
              className="flex flex-row overflow-x-auto no-scrollbar"
            >
              {/* <!-- Add group buttons here --> */}
            </div>
          </div>
        </div>
        <div
          id="matchDiv"
          className="flex flex-col mt-2 p-2 ml-8 border border-gray-300 rounded-lg hidden"
        >
          <label htmlFor="match" className="underline">
            Match
          </label>
          <div
            id="match"
            className="flex flex-row overflow-x-auto no-scrollbar"
          >
            {/* <!-- Add match buttons here --> */}
          </div>
        </div>
        <div className="flex flex-row overflow-auto mt-2">
          <div
            id="statsDiv"
            className="flex flex-col p-2 ml-8 border border-gray-300 rounded-lg hidden"
          >
            <label htmlFor="stats" className="underline">
              Stats
            </label>
            <div
              id="stats"
              className="flex flex-row overflow-x-auto no-scrollbar"
            >
              <button
                id="afterMatch"
                value="afterMatch"
                className="hover:bg-gray-700 hover:text-white py-2 mx-1 px-4 rounded"
              >
                After Match
              </button>
              <button
                value="teamStats"
                className="hover:bg-gray-700 hover:text-white bg-gray-700 text-white mx-1 py-2 px-4 rounded"
              >
                Team Stats
              </button>
              <button
                value="playerStats"
                className="hover:bg-gray-700 hover:text-white py-2 mx-1 px-4 rounded"
              >
                Player Stats
              </button>
              <button
                id="mvpStats"
                value="mvpStats"
                className="hover:bg-gray-700 hover:text-white py-2 mx-1 px-4 rounded"
              >
                Top 10 MVP Stats
              </button>
            </div>
          </div>

          <div
            id="teamListDiv"
            className="flex flex-col p-2 ml-8 border border-gray-300 rounded-lg hidden"
          >
            <label htmlFor="teamList">Team List</label>
            <select
              id="teamList"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="all">Select Team</option>
            </select>
          </div>
        </div>
      </div>
      <h5 className="mt-4">{error}</h5>
      {isLoading ? <Loading /> : <div></div>}
      <div className="overflow-auto text-center">
        <div className=" p-3 py-8">
          <table className="table-auto dark:bg-black bg-white border-collapse border border-black w-42 mx-auto">
            <thead></thead>
            <tbody></tbody>
          </table>
        </div>

        <div>
        {/* <h2 className="text-center text-2xl mt-4">Title: {`${messageContent.stage} - ${messageContent.match}`}</h2> */}
        <button onClick={sendResult} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
            Send Result
        </button>
        {success && <p className="text-green-500">{success}</p>}
      </div>
      </div>
    </>
  );
}
