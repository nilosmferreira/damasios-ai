Here's the provided text converted into Markdown format:

Certainly! Based on the provided requirements document "cfpb-requirements.md", let's outline a Product Requirements Document (PRD) for the Basketball Pick-up Game Financial Control System.

## Product Requirements Document (PRD): Basketball Pick-up Game Financial Control System

### 1. Introduction

This document outlines the requirements for a system designed to manage the finances and participation of a basketball pick-up game. The system aims to streamline the process of athlete registration, match scheduling, financial tracking, and team formation, providing a clear and concise overview for coordinators/administrators and limited access for athletes.

### 2. Goals and Objectives

The primary goal of this system is to provide an efficient and reliable platform for managing basketball pick-up games. Key objectives include:

- Automating financial tracking for both daily and monthly fee payers.
- Simplifying the management of athlete attendance and participation.
- Facilitating fair team formation through an intelligent sorting algorithm.
- Providing clear financial reports for better oversight.
- Ensuring data security and system stability.

### 3. Stakeholders

- **Coordinators/Administrators:** Responsible for overall system management, including athlete registration, match scheduling, financial operations, and team sorting.
- **Athletes:** Users who will confirm attendance for matches and view their financial obligations.

### 4. Functional Requirements

#### 4.1. Athlete Management

- **RF001**: The system must allow a coordinator/administrator to **register athletes**, including their name, billing type (daily or monthly), and preferred positions (point guard, forward, shooting guard, center, power forward).
- **RF002**: The system must allow a coordinator/administrator to **edit athlete data** (name, billing type, preferred positions).
- **RF003**: The system must allow a coordinator/administrator to **activate/inactivate athletes**. Inactive athletes should not appear in attendance lists or sorting processes.
- **RF004**: The system must display a **list of all registered athletes** with their respective data.

#### 4.2. Match Management

- **RF005**: The system must allow a coordinator/administrator to **register new matches**, specifying location and time.
- **RF006**: The system must allow a coordinator/administrator to **edit match data** (location, time).
- **RF007**: The system must display a **list of registered matches** with their details.
- **RF008**: The system must allow an **atleta to confirm presence** in a specific match.
- **RF009**: The system must display the **list of athletes who confirmed presence** in a match.
- **RF010**: The system must allow the coordinator/administrator to **register the effective participation of an athlete** in a match (indicating that he actually played).

#### 4.3. Financial Control

- **RF011**: The system must **automatically generate a financial pending item** for daily athletes who participated in a match.
- **RF012**: The system must **automatically generate a monthly financial pending item** for monthly athletes by the 10th of each month.
- **RF013**: The system must allow a coordinator/administrator to **record payments of financial pending items** (settlement).
- **RF014**: The system must display the **status of all financial pending items** (pending, paid), with athlete details, amount, and due/payment date.
- **RF015**: The system must allow the **recording of all cash inflows** (from daily and monthly payments).
- **RF016**: The system must allow the **recording of all cash outflows** (court rental, referee payment, caretaker, etc.), with description and amount.
- **RF017**: The system must generate a **monthly report of cash inflows and outflows**, presenting the monthly balance.
- **RF018**: The system must ensure that the **previous month's balance is transferred as the initial balance** for the current month.

#### 4.4. Quintet Sorting

- **RF019**: The system must allow the coordinator/administrator to **sort quintets** from the list of athletes with confirmed presence in a match.
- **RF020**: The sorting process must **prioritize monthly athletes** in forming the quintets.
- **RF021**: The sorting process should attempt to **distribute athletes by positions**, following the ideal of:
  - One point guard
  - Two forwards (can be one small forward and one shooting guard)
  - Two centers (can be one center and one power forward)
- **RF022**: The system must display the **suggested quintets** after the sort.

#### 4.5. User and Access Management

- **RF023**: The system must allow a coordinator/administrator to **register new users** (coordinators/administrators and athletes).
- **RF024**: The system must have a **user authentication mechanism** (login and password).
- **RF025**: The system must **differentiate access levels**:
  - **Coordenador/Administrador**: Full access to all management functionalities (athlete registration, matches, finances, sorting, user management).
  - **Atleta**: Limited access to confirm presence and view their own financial pending items.

### 5. Non-Functional Requirements

- **RNF001 - Usability**: The system must have an intuitive and easy-to-use user interface, especially for the coordinators/administrators.
- **RNF002 - Performance**: The system must respond to user requests in an acceptable time, even with a growing number of athletes and matches.
- **RNF003 - Security**: The system must protect user and financial data against unauthorized access. Passwords must be stored securely (hashing).
- **RNF004 - Confiabilidade**: The system must be stable and robust, minimizing the occurrence of errors and failures.
- **RNF005 - Manutenibilidade**: The source code must be well-structured and documented, facilitating future maintenance and evolution.
- **RNF006 - Escalabilidade**: The system must be able to support an increase in the number of athletes, matches, and financial transactions without significant performance degradation.

### 6. Future Considerations (Out of Scope for Initial Release)

- Integration with payment gateways.
- Notification system for pending payments or match reminders.
- Detailed statistical reports for athletes (e.g., attendance history).

### 7. Success Metrics

- **User Adoption:** Percentage of active athletes using the system to confirm presence.
- **Financial Accuracy:** Minimal discrepancies between physical cash and system records.
- **Coordinator Efficiency:** Reduction in time spent on manual administrative tasks.
- **System Uptime:** Percentage of time the system is operational and accessible.

### 8. Technical Considerations (High-Level)

- **Database:** Relational database (e.g., PostgreSQL, MySQL) for structured data storage.
- **Backend:** A robust framework (e.g., Django, Ruby on Rails, Node.js with Express) for business logic and API development.
- **Frontend:** A modern JavaScript framework (e.g., React, Angular, Vue.js) for an interactive user interface.
- **Authentication:** Secure authentication library/service.

This PRD provides a comprehensive overview of the system's requirements, serving as a foundational document for design, development, and testing phases.
