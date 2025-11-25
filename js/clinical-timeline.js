// Global variables
let timelineAppState = {
    data: null,
    
    visElements: {
      groups: new vis.DataSet(),
      items: new vis.DataSet(),
      timeline: null
    },
    
    uiState: {
      groupNames: [],
      highlightEvents: []
    },
  };

// Initialize the application
document.addEventListener("DOMContentLoaded", async function() {
    await loadData();
    initializeApplication();
});

// Load data from JSON file
async function loadData() {
    try {
        // const response = await fetch('data/IPS Bundle example.json');
        const response = await fetch('data/clinical_data.json');
        timelineAppState.data = await response.json();
        return timelineAppState.data;
    } catch (error) {
        console.error('Error loading data:', error);
        return null;
    }
}

/* 
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │                                                                           │
 * │                          T O O G L E   B U T T O N                        │
 * │                                                                           │
 * └───────────────────────────────────────────────────────────────────────────┘
 */

document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggleFilterButton');
  const filterSection = document.getElementById('filterSection');

  filterSection.classList.add('hidden');

  toggleButton.addEventListener('click', () => {
    filterSection.classList.toggle('hidden');
  });
});

/* 
 *  ████████╗██╗███╗   ███╗███████╗██╗     ██╗███╗   ██╗███████╗
 *  ╚══██╔══╝██║████╗ ████║██╔════╝██║     ██║████╗  ██║██╔════╝
 *     ██║   ██║██╔████╔██║█████╗  ██║     ██║██╔██╗ ██║█████╗  
 *     ██║   ██║██║╚██╔╝██║██╔══╝  ██║     ██║██║╚██╗██║██╔══╝  
 *     ██║   ██║██║ ╚═╝ ██║███████╗███████╗██║██║ ╚████║███████╗
 *     ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝
 */

function initializeApplication() {
    let timelineElement = document.getElementById("timeline");
    let currentView = "timeline";

    //groupNames = groupWithDate(data);
    groupNames = timelineAppState.data.groups;
    
    // const id = getPatientId(data);
    // groupColors = createColors(groupNames);

    timelineAppState.data.items.forEach((eventData, index) => {
        const startDate = new Date(eventData.initialDate + "T00:00:00");
        const endDate = new Date(eventData.finalDate + "T00:00:00");
        endDate.setDate(endDate.getDate() + 1);
        const group = timelineAppState.data.groups.find(group => group.idType === eventData.idType);

        let currentDate = new Date(startDate);
        timelineAppState.uiState.highlightEvents.push({
            id: `${index}-${currentDate.toISOString().split("T")[0]}`,
            title: eventData.name || "Unknown",
            resource: eventData.idType,
            start: new Date(currentDate),
            end: new Date(endDate),
            description: eventData.description,
            color: group.colour,
            allDay: true
        });
    
    });

    let lastEventDate = timelineAppState.uiState.highlightEvents.reduce((latest, event) => {
        return event.start > latest ? event.start : latest;
    }, timelineAppState.uiState.highlightEvents[0]?.start || new Date().toISOString().split("T")[0]);

    // Initialize timeline
    let firstTimeTimeline = true;
    if (currentView === "timeline") {
        timelineElement.style.display = "block";
        let newDate = new Date(lastEventDate); 
        newDate.setDate(newDate.getDate() + 1);
        if (firstTimeTimeline) {
            initializeTimeline(lastEventDate, newDate);
            firstTimeTimeline = false;
        }
        else {
            timeline.setWindow(lastEventDate, newDate);
        }
    }

    // Open Calendar button
    let calendarButton = document.getElementById("CalendarButton");
    calendarButton.addEventListener("click", function () {
        let CalendarPopup = document.getElementById('Calendar-popup');
        
        if (!CalendarPopup) {
            currentView = "multiMonthYear";
            createCalendarPopup(lastEventDate, currentView);
            return;
        }
    
        const isHidden = CalendarPopup.style.display === 'none' || 
                        getComputedStyle(CalendarPopup).display === 'none';
    
        if (isHidden) {
            setTimeout(() => {
                CalendarPopup.style.display = 'block';
                document.addEventListener('click', closeOnClickOutside);
            }, 10);
            setTimeout(() => {
                document.addEventListener('click', closeOnClickOutside);
            }, 10);
        } else {
            CalendarPopup.style.display = 'none';
            document.removeEventListener('click', closeOnClickOutside);
        }
    });

    // Popup to show events by group
    addClickListenersToVisInner();

    // Toggle the dropdown list when clicked for "Content" button
    document.querySelector('.dropdownlist').addEventListener('click', () => {
        document.querySelector('.list').classList.toggle('show');
    });
}

function initializeTimeline(startDate, endDate) {
    // groupNames = groupWithDate(data);
    let groupNames = timelineAppState.data.groups;
    // const id = getPatientId(data);
    timelineAppState.visElements.groups.clear();
    groupNames.forEach((group, index) => {
        timelineAppState.visElements.groups.add({ 
            id: group.idType, 
            content: group.nameType.replace(/([A-Z])/g, ' $1').trim(), 
            style: `background-color: ${group.colour}; color: white; border: none`,
            colour: group.color
        });
    });

    timelineAppState.data.items.forEach((eventData, index) => {
        const startDate = new Date(eventData.initialDate + "T00:00:00");
        const endDate = new Date(eventData.finalDate + "T00:00:00");
        endDate.setDate(endDate.getDate() + 1);

        const groupIndex = timelineAppState.data.groups.find(group => group.idType === eventData.idType);
        timelineAppState.visElements.items.add({
            id: index,
            group: eventData.idType,
            content: eventData.name || "Unknown",
            start: startDate,
            end: endDate,
            colour: groupIndex.colour,
            style: `background-color: ${groupIndex.colour}`,
            description: eventData.description
        });
    });
    let container = document.getElementById("visualization");
    let options = {
        stack: true,
        horizontalScroll: false,
        zoomable: true,
        maxHeight: 800,
        start: startDate,
        end: endDate,
        editable: {
            add: false,
            updateTime: false,
            updateGroup: false,
            remove: false, 
        },
        margin: { item: 10, axis: 5 },
        orientation: "both",
        zoomMin: 1000 * 60 * 60 * 24 * 0.5,
        zoomMax: 1000 * 60 * 60 * 24 * 365 * 100,
        min: new Date(1900, 6, 15),
        max: new Date(),
        showMajorLabels: true,
    };

    timelineAppState.visElements.timeline = new vis.Timeline(container, timelineAppState.visElements.items, timelineAppState.visElements.groups, options);
    let selectedItemId = null;
    
    timelineAppState.visElements.timeline.on('select', function (properties) {
        selectedItemId = properties.items[0];
    });

    timelineAppState.visElements.timeline.on('click', function (event) {
        if (selectedItemId==null) {
            return;
        }

        const item = timelineAppState.visElements.items.get(selectedItemId);
        const x = event.pointer?.x || event.event?.pageX;
        const y = event.pointer?.y || event.event?.pageY;
    
        createPopup(item.content, item.start, item.end, item.description, item.colour, x, y);
        selectedItemId = null;
    });
    
    timelineAppState.visElements.timeline.on('rangechange', function (properties) {
        removePopup();
    });
    
    /*setTimeout(() => {
        document.querySelectorAll('.vis-labelset .vis-label').forEach((label, index) => {
            label.style.cursor = 'pointer';
            label.addEventListener('click', (event) => {
                const groupId = groups.getIds()[index];
                const groupName = groupNames[index];
                showColorPicker(event.clientX, event.clientY, groupId, groupName);
            });
        });
    }, 100);*/

    document.getElementById("groupDropdownButton").addEventListener("click", function(event) {
        const list = document.getElementById("groupList");
    
        if (list.style.display === "block") {
            list.style.display = "none";
            document.removeEventListener('click', closeOnClickOutside);
        } else {
            openSelectGroups();
        }
    });
    populateDropdown();

    insertSearchButtonAboveGroups();

    // setTimeout(() => {
    //     document.querySelectorAll('.vis-labelset .vis-label').forEach((label) => {
    //         label.style.cursor = 'pointer';
    //         label.addEventListener('click', handleLabelClick);
    //     });
    // }, 100);
}

// Helper function to remove the back button of calendar when it's not needed.
function toggleBackButtonVisibility(viewName) {
    const backButton = document.querySelector('.fc-backbutton-button');
    if (backButton) {
        if (viewName === "multiMonthYear") {
            backButton.style.display = "none";
        } else {
            backButton.style.display = "inline-block";
        }
    }
}

/* 
 *  ┌───────────────────────────────────────────────────────────────────────────┐
 *  │                                                                           │
 *  │                        C O N T E N T   F I L T E R                        │
 *  │                                                                           │
 *  └───────────────────────────────────────────────────────────────────────────┘
 */

function populateDropdown() {
    const list = document.getElementById("groupList");
    list.innerHTML = '';

    groupNames.forEach((group, index) => {
        const item = document.createElement("label");
        item.className = "content";
        item.innerHTML = `
            <input 
                type="checkbox" 
                onclick="filterGroups()" 
                id="group_${index}" 
                value="${group.idType}" 
                checked
            > ${group.nameType}`;
        list.appendChild(item);
    });
}

function openSelectGroups() {
    const list = document.getElementById("groupList");
    list.style.display = 'block';

    setTimeout(() => {
        document.addEventListener('click', closeOnClickOutside);
    }, 10);
}

function filterGroups() {
    selectedGroups = [];

    groupNames.forEach((group, index) => {
        const checkbox = document.getElementById("group_" + index);
        if (checkbox && checkbox.checked) {
            selectedGroups.push(group.idType);
        }
    });

    if (selectedGroups.length === 0) {
        alert("Please select at least one group!");
        return;
    }

    let filteredGroups = new vis.DataSet();
    selectedGroups.forEach(id => {
        filteredGroups.add(timelineAppState.visElements.groups.get(id));
    });

    timelineAppState.visElements.timeline.setGroups(filteredGroups);
    addClickListenersToVisInner();
}

function addClickListenersToVisInner() {
    document.querySelectorAll('.vis-inner').forEach(div => {
        div.addEventListener('click', () => {
            const groupName = div.innerHTML.trim();
            const groupPopup = document.getElementById('Events-popup');

            if (groupPopup) {
                removePopup();
                return;
            }

            const group = timelineAppState.visElements.groups.get({
                filter: g => g.content === groupName
            })[0];

            const items = timelineAppState.visElements.items.get({
                filter: item => item.group === group.id
            });

            const sortedItems = items.sort((a, b) => new Date(b.start) - new Date(a.start));
            showGroupEventsPopup(sortedItems, div);
        });
    });
}

/* 
 *  ┌───────────────────────────────────────────────────────────────────────────┐
 *  │                                                                           │
 *  │                     T I M E  R A N G E  F I L T E R                       │
 *  │                                                                           │
 *  └───────────────────────────────────────────────────────────────────────────┘
 */

function insertSearchButtonAboveGroups() {
    const labelSet = document.querySelector('.vis-background');
    if (!labelSet) return;
    if (document.getElementById('openSearchPopup')) return;

    const searchBtn = document.createElement('button');
    searchBtn.id = 'openSearchPopup';
    searchBtn.innerText = '🔍';
    searchBtn.title = 'Search Event';

    searchBtn.style.position = 'absolute';
    searchBtn.style.backgroundColor = 'transparent';
    searchBtn.style.cursor = 'pointer';
    searchBtn.style.zIndex = '9';

    labelSet.parentNode.insertBefore(searchBtn, labelSet);

    searchBtn.addEventListener('click', (e) => {
        const existingPopup = document.getElementById('search-popup');
        if (existingPopup) {
            removePopup("search");
            return;
        }
        createSearchPopup(e.clientX, e.clientY); 
    });
}

function updateTimelineData() {
    let startDateElement = document.getElementById("startDate");
    let endDateElement = document.getElementById("endDate");

    let startDateInput = startDateElement.value;
    let endDateInput = endDateElement.value;

    if (!startDateInput || !endDateInput) {
        return;
    }

    if ((startDateInput && !endDateInput) || (!startDateInput && endDateInput)) {
        alert("Please select both dates!");
        return;
    }

    let startDate = new Date(startDateInput + "T00:00:00");
    let endDate = new Date(endDateInput + "T00:00:00");

    if (startDate >= endDate) {
        alert("End date must be after start date!");
        return;
    }

    timelineAppState.visElements.timeline.setWindow(startDate, endDate);
}

/* 
 *  ┌───────────────────────────────────────────────────────────────────────────┐
 *  │                                                                           │
 *  │                              P O P  U P ' S                               │
 *  │                                                                           │
 *  └───────────────────────────────────────────────────────────────────────────┘
 */

function createSearchPopup(clickX, clickY) {
    removePopup();

    const popup = document.createElement('div');
    popup.id = 'search-popup';
    popup.style.position = 'absolute';
    popup.style.left = `${clickX + 10}px`;
    popup.style.top = `${clickY - 80}px`;
    popup.style.backgroundColor = 'var(--background-color)';
    popup.style.border = '1px solid var(--borders-color)';
    popup.style.borderRadius = '10px';
    popup.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    popup.style.padding = '16px';
    popup.style.zIndex = '1001';
    popup.style.width = '280px';
    popup.style.color = 'var(--text)';
    
    popup.innerHTML = `
        <label for="searchInputPopup" style="font-weight: bold; color: var(--text);">Search Event:</label><br>
        <input 
            type="text" 
            id="searchInputPopup" 
            placeholder="Type event content..." 
            style="
                width: 100%; 
                box-sizing: border-box;
                padding: 8px; 
                margin-top: 8px; 
                border-radius: 6px; 
                border: 1px solid var(--borders-color); 
                background-color: var(--body-background); 
                color: var(--text);
            " 
        />
        <div id="searchErrorMsg" style="color: red; margin-top: 10px; display: none;">
            No Results Found!
        </div>
        <div id="searchNavButtons" 
            style="
                margin-top: 10px; 
                display: none; 
            ">
            <button 
                id="prevResult" 
                class="generic-button"
            ><</button>
            <button 
                id="nextResult" 
                class="generic-button"
            >></button>
        </div>
    `;

    document.body.appendChild(popup);

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✖';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '1.2em';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = 'var(--text)';
    closeBtn.style.padding = '4px';
    closeBtn.style.borderRadius = '4px';
    closeBtn.addEventListener('click', () => removePopup("search"));
    popup.appendChild(closeBtn);

    const input = document.getElementById('searchInputPopup');
    input.focus();

    let matches = [];
    let currentIndex = 0;

    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            const query = input.value.trim().toLowerCase();
            if (query === '') return;

            const allItems = timelineAppState.visElements.items.get();
            matches = allItems.filter(item => item.content.toLowerCase().includes(query));

            if (matches.length === 0) {
                document.getElementById('searchErrorMsg').style.display = 'block';
                document.getElementById('searchNavButtons').style.display = 'none';
                return;
            } else {
                document.getElementById('searchErrorMsg').style.display = 'none';
            }

            if (matches.length > 1) {
                document.getElementById('searchNavButtons').style.display = 'block';
            }

            currentIndex = 0;
            goToMatch(matches[currentIndex]);
        }
    });

    function goToMatch(eventItem) {
        const start = new Date(eventItem.start);
        const end = eventItem.end ? new Date(eventItem.end) : new Date(start.getTime() + 60 * 60 * 1000); // +1h
        timelineAppState.visElements.timeline.setWindow(start, end, { animation: true });
    }

    document.getElementById('prevResult').addEventListener('click', () => {
        if (matches.length === 0) return;
        currentIndex = (currentIndex - 1 + matches.length) % matches.length;
        goToMatch(matches[currentIndex]);
    });

    document.getElementById('nextResult').addEventListener('click', () => {
        if (matches.length === 0) return;
        currentIndex = (currentIndex + 1) % matches.length;
        goToMatch(matches[currentIndex]);
    });

    setTimeout(() => {
        document.addEventListener('click', closeOnClickOutside);
    }, 10);
}

function showGroupEventsPopup(events, anchorElement) {
    removePopup();

    const popup = document.createElement('div');
    popup.id = 'Events-popup';
    popup.style.position = 'absolute';

    const rect = anchorElement.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;

    popup.style.width = `${anchorElement.parentElement.offsetWidth}px`;

    popup.style.backgroundColor = 'var(--background-color)';
    popup.style.color = 'var(--text)';
    popup.style.border = '1px solid var(--borders-color)';
    popup.style.padding = '10px';
    popup.style.zIndex = '1000';
    popup.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    popup.style.borderRadius = '8px';
    popup.style.fontFamily = 'Arial, sans-serif';
    popup.style.maxHeight = '300px';
    popup.style.overflowY = 'auto';

    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';
    list.style.margin = '0';
    
    events.forEach(event => {
        const item = document.createElement('li');
        item.style.marginBottom = '1em';
        item.style.padding = '1em';
        item.style.border = '1px solid var(--borders-color)';
        item.style.borderRadius = '6px';
        item.style.backgroundColor = 'var(--body-background)';
        item.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
        
        item.style.flex = '0 0 auto';
        item.style.boxSizing = 'border-box';
    
        item.innerHTML = `
        <strong>${event.content}</strong><br>
        <small>${new Date(event.start).toLocaleString()}</small>
        `;

        // Add click event to each item
        item.addEventListener('click', () => {
            timelineAppState.visElements.timeline.setWindow(
                new Date(event.start),
                new Date(event.end)
            );
            removePopup();
        });

        list.appendChild(item);
    });
    
    popup.appendChild(list);

    const container = document.querySelector('.container') || document.body;
    container.appendChild(popup);

    setTimeout(() => {
        document.addEventListener('click', closeOnClickOutside);
    }, 10);
}

function createPopup(title, start, end, description, colour, x, y) {
    removePopup("item");

    let popup = document.createElement('div');
    popup.id = 'item-popup';
    popup.style.position = 'absolute';
    popup.style.width = '250px';
    popup.style.border = '1px solid #ddd';
    popup.style.padding = '12px';
    popup.style.borderRadius = '12px';
    popup.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    popup.style.zIndex = '1000';

    function formatDate(dateString) {
        let date = new Date(dateString);
        return date.toLocaleDateString('pt-PT');
    }

    let dateRange = `${formatDate(start)} - ${formatDate(end - 1)}`;

    popup.innerHTML = `
        <div style="font-size: 14px; font-weight: bold;">${title} <span style="color: ${colour}">●</span></div>
        <div style="font-size: 12px;" class="item-popup-description">${dateRange}</div>
        <div style="margin-top: 8px; font-size: 12px;">${description}</div>
    `;

    document.body.appendChild(popup);

    const popupRect = popup.getBoundingClientRect();
    const padding = 10;

    if (x + popupRect.width + padding > window.innerWidth) {
        x = x - popupRect.width;
    }

    if (y + popupRect.height + padding > window.innerHeight) {
        y = window.innerHeight - popupRect.height;
    }

    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;

    setTimeout(() => {
        document.addEventListener('click', closeOnClickOutside);
    }, 10);
}

function createCalendarPopup(lastEventDate, currentView) {
    removePopup();

    let popup = document.createElement('div');
    popup.id = 'Calendar-popup';
    popup.style.position = 'absolute';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.width = '80%';
    popup.style.maxWidth = '50em';
    popup.style.backgroundColor = '#fff';
    popup.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    popup.style.border = '1px solid var(--borders-color)';
    popup.style.borderRadius = '8px';
    popup.style.padding = '20px';
    popup.style.zIndex = '1000';
    
    let CalendarOptions = {
        initialView: 'multiMonthYear',
        locale: 'en',
        selectable: true,
        headerToolbar: {
            left: 'prev next backbutton',
            center: 'title',
            right: 'lastEvent today'
        },
        customButtons: {
            backbutton: {
                text: 'Back',
                click: function () {
                    if (currentView === "dayGridMonth") {
                        currentView = "multiMonthYear";
                        calendar.changeView(currentView);
                        toggleBackButtonVisibility(currentView);
                    }
                }
            },
            lastEvent: {
                text: 'Last Event',
                click: function () {
                    calendar.gotoDate(lastEventDate);
                }
            }
        },
        dayMaxEventRows: 3,
        initialDate: lastEventDate,
        dateClick: function(info) {
            popup.style.display = "none";
            let newDate = new Date(info.date); 
            newDate.setDate(newDate.getDate() + 1);
            timelineAppState.visElements.timeline.setWindow(info.date, newDate); 
        },
        events: timelineAppState.uiState.highlightEvents,
        
        eventClick: function(info) {
            const event = info.event;


            const x = info.jsEvent.clientX + window.scrollX;
            const y = info.jsEvent.clientY + window.scrollY;
            
            createPopup(
                event.title,
                event.start,
                event.end,
                event.extendedProps.description || '',
                event.backgroundColor || '#000',
                x,
                y
            );
        },
        eventDidMount(info) {
            info.el.style.cursor = 'pointer';
        }
    }

    let calendarElement = document.createElement('div');
    calendarElement.id = 'popup-calendar';
    popup.appendChild(calendarElement);

    const container = document.querySelector('.container');
    container.appendChild(popup);

    const calendar = new FullCalendar.Calendar(calendarElement, CalendarOptions);
    calendar.render();
    toggleBackButtonVisibility(currentView);

    // Event delegation to detect clicks on multi-month view titles
    document.addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('fc-multimonth-title')) {
            const month = event.target.textContent.trim();
            const year = calendar.getDate().getFullYear();

            const date = new Date(`${month} 1, ${year}`); 

            currentView = "dayGridMonth";
            calendar.changeView(currentView, date);
            toggleBackButtonVisibility(currentView);
        }
    });
    
    setTimeout(() => {
        document.addEventListener('click', closeOnClickOutside);
    }, 0);
}

function removePopup(x) {
    const existingPopup = document.getElementById('item-popup');
    let CalendarPopup = document.getElementById('Calendar-popup');
    let selectGroupsPopup = document.getElementById('groupList');
    const groupPopup = document.getElementById('Events-popup');
    const searchPopup = document.getElementById('search-popup');
    if (searchPopup && x == "search") searchPopup.remove();
    if (existingPopup) existingPopup.remove();
    if (groupPopup) groupPopup.remove();
    if (CalendarPopup && x != "item") {
        CalendarPopup.style.display = 'none';
    }
    if (selectGroupsPopup) {
        selectGroupsPopup.style.display = 'none';
    }
    document.removeEventListener('click', closeOnClickOutside);
}

function closeOnClickOutside(event) {
    const popup = document.getElementById('item-popup');
    const calendarPopup = document.getElementById('Calendar-popup');
    const selectGroupsPopup = document.getElementById('groupList');
    const groupPopup = document.getElementById('Events-popup');
    const searchPopup = document.getElementById('search-popup');
    if (searchPopup && !searchPopup.contains(event.target)) searchPopup.remove();
    if (groupPopup && !groupPopup.contains(event.target)) groupPopup.remove();
    if (popup && !popup.contains(event.target)) popup.remove();

    if (
        calendarPopup &&
        !calendarPopup.contains(event.target) && 
        !event.target.closest('.fc-multimonth-header')
    ) {
        calendarPopup.style.display = 'none';
    }

    if (
        selectGroupsPopup &&
        !selectGroupsPopup.contains(event.target) &&
        event.target.id !== 'groupDropdownButton'
    ) {
        selectGroupsPopup.style.display = 'none';
    }

    const stillOpen =
        document.getElementById('item-popup') ||
        (calendarPopup && calendarPopup.style.display !== 'none') ||
        (selectGroupsPopup && selectGroupsPopup.style.display !== 'none') ||
        document.getElementById('search-popup') || 
        document.getElementById('Events-popup');

    if (!stillOpen) {
        document.removeEventListener('click', closeOnClickOutside);
    }
}

/* ----------------- Unused functions ----------------- */

/* function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return JSON.parse(parts.pop().split(';').shift());
    return null;
}

function setCookie(name, value, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${JSON.stringify(value)}; expires=${date.toUTCString()}; path=/`;
}*/

// Color picker functions
/*function showColorPicker(x, y, groupId, groupName) {
    removeColorPicker();

    const picker = document.createElement('div');
    picker.id = 'color-picker';
    picker.style.position = 'absolute';
    picker.style.padding = '10px';
    picker.style.background = '#fff';
    picker.style.border = '1px solid #ccc';
    picker.style.borderRadius = '8px';
    picker.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    picker.style.zIndex = 2000;
    picker.style.display = 'flex';
    picker.style.gap = '8px';
    picker.style.flexWrap = 'wrap';

    const currentColor = groupColors[groupName] || '#ffffff';

    colorList.forEach(color => {
        const btn = document.createElement('div');
        btn.style.background = color;
        btn.style.width = '20px';
        btn.style.height = '20px';
        btn.style.borderRadius = '50%';
        btn.style.cursor = 'pointer';
        btn.title = color;

        if (color === currentColor) {
            btn.style.boxShadow = '0 0 0 3px rgb(0, 0, 0)';
        }

        btn.addEventListener('click', () => {
            updateGroupColor(groupId, groupName, color);
            removeColorPicker();
        });
        picker.appendChild(btn);
    });

    document.body.appendChild(picker);

    const pickerRect = picker.getBoundingClientRect();
    const padding = 10;

    let absoluteX = x;
    let absoluteY = y;

    if (y + pickerRect.height + padding > window.innerHeight) {
        absoluteY = y - pickerRect.height;
    }

    picker.style.left = `${absoluteX}px`;
    picker.style.top = `${absoluteY}px`;

    setTimeout(() => {
        document.addEventListener('click', closeColorPickerOutside);
    }, 10);
}*/

/*function removeColorPicker() {
    const existing = document.getElementById('color-picker');
    if (existing) existing.remove();
    document.removeEventListener('click', closeColorPickerOutside);
}*/

/*function closeColorPickerOutside(e) {
    const picker = document.getElementById('color-picker');
    if (picker && !picker.contains(e.target)) {
        removeColorPicker();
    }
}*/

/*function updateGroupColor(groupId, groupName, newColor) {
    const group = groups.get(groupId);
    if (group) {
        groups.update({
            id: groupId,
            content: group.content,
            style: `background-color: ${newColor}; color: white; border: none`
        });

        groupColors[groupName] = newColor;

        const patientId = getPatientId(data);
        setCookie(`patientColors_${patientId}`, groupColors);

        const updatedItems = items.get({
            filter: item => item.group === groupId
        }).map(item => ({
            id: item.id,
            color: newColor,
            style: `background-color: ${newColor}; color: white; border: none`
        }));
        items.update(updatedItems);

        highlightEvents.forEach(event => {
            if (event.resource === groupName) {
                event.color = newColor;
            }
        });

        calendar.removeAllEvents();
        highlightEvents.forEach(event => {
            calendar.addEvent({
                title: event.title,
                start: event.start,
                color: event.color,
                allDay: true
            });
        });
    }
}*/

/*function groupWithDate(data) {
    const groupNamesSet = new Set();
    data.entry.forEach((entry) => {
        const resource = entry.resource;
        for (const key in resource) {
            if (key.toLowerCase().includes("date") && key.toLowerCase() !== "birthdate") {
                if (resource.resourceType !== "Composition") {
                    groupNamesSet.add(resource.resourceType);
                    break;
                }
            }
        }
    });
    return Array.from(groupNamesSet);
}*/

/*function getEvents(data) {
    let dateInfoArray = [];
    data.entry.forEach((entry, index) => {
        const resource = entry.resource;
    
        let startDate;
        for (const key in resource) {
            if (key.toLowerCase().includes("date") && key.toLowerCase() !== "birthdate" && resource.resourceType !== "Composition") {
                const dateString = resource[key];
                if (dateString.includes("/")) {
                    const [datePart, timePart] = dateString.split(" ");
                    const [month, day, year] = datePart.split("/");
                    startDate = new Date(year, month-1, day);
                } else {
                    const [year, month, day] = dateString.split("-");
                    startDate = new Date(year, month-1, day);
                } 
                break;
            }
        }
    
        if (startDate) {
            dateInfoArray.push({
                date: startDate,
                index: resource.id,
                resource: resource.resourceType
            });
        }
    });
    return dateInfoArray;
}*/

/*function getPatientId(data) {
    if (!data || !data.entry) return null;
    for (const entry of data.entry) {
        const resource = entry.resource;
        if (resource.resourceType === "Patient") {
            return resource.id;
        }
    }
    return null;
}*/

// function createColors(groupNames) {
//     // const cookieName = `patientColors_${patientId}`;
//     let colors = {};
//     //const savedColors = getCookie(cookieName);

//     /*if (savedColors) {
//         colors = savedColors;
        
//         groupNames.forEach((type, index) => {
//             if (!colors[type]) {
//                 colors[type] = colorList[index % colorList.length];
//             }
//         });
//     }
//         groupNames.forEach((type, index) => {
//             colors[type.idType] = colorList[index % colorList.length];
//         });
    
//     //setCookie(cookieName, colors);
    
//     return colors;
// }

// function reattachColorPickerHandlers() {
//     setTimeout(() => {
//         const visibleLabels = document.querySelectorAll('.vis-labelset .vis-label');
        
//         visibleLabels.forEach((label) => {
//             label.removeEventListener('click', handleLabelClick);
            
//             label.addEventListener('click', handleLabelClick);
//         });
//     }, 100);
// }

// function handleLabelClick(event) {
//     const labelContent = event.currentTarget.textContent.trim();
//     const groupIndex = groupNames.findIndex(name => 
//         name.replace(/([A-Z])/g, ' $1').trim() === labelContent
//     );
    
//     if (groupIndex !== -1) {
//         const groupId = groups.getIds()[groupIndex];
//         const groupName = groupNames[groupIndex];
//         //showColorPicker(event.clientX, event.clientY, groupId, groupName);                    Popup to show a new colour
//     }
// }
