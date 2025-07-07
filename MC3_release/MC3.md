# Mini-Challenge 3

**Deadline**

The submission deadline is July 15, 2025 at 11:59 pm AOE.

**Requirements**

- explanatory video with voice narration
- summary file
- two-Page Summaries
- code

## Background

---

Over the past decade, the community of Oceanus has faced numerous transformations and challenges evolving from its fishing-centric origins. Following major crackdowns on illegal fishing activities, suspects have shifted investments into more regulated sectors such as the ocean tourism industry, resulting in growing tensions. This increased tourism has recently attracted the likes of international pop star Sailor Shift, who announced plans to film a music video on the island.

Clepper Jessen, a former analyst at FishEye and now a seasoned journalist for the Hacklee Herald, has been keenly observing these rising tensions. Recently, he turned his attention towards the temporary closure of Nemo Reef. By listening to radio communications and utilizing his investigative tools, Clepper uncovered a complex web of expedited approvals and secretive logistics. These efforts revealed a story involving high-level Oceanus officials, Sailor Shift’s team, local influential families, and local conservationist group The Green Guardians, pointing towards a story of corruption and manipulation.

Your task is to develop new and novel visualizations and visual analytics approaches to help Clepper get to the bottom of this story.

## Tasks and Questions

Clepper diligently recorded all intercepted radio communications over the last two weeks. With the help of his intern, they have analyzed their content to identify important events and relationships between key players. The result is a knowledge graph describing the last two weeks on Oceanus. Clepper and his intern have spent a large amount of time generating this knowledge graph, and they would now like some assistance using it to answer the following questions.

1. Clepper found that messages frequently came in at around the same time each day.

   1. Develop a graph-based visual analytics approach to identify any daily temporal patterns in communications.
      - → timeline component + daily graph
   2. How do these patterns shift over the two weeks of observations?
      - → intercepted communications come in daily from 11:00 am to 04:00 pm. On all weekdays, as well as on weekends
      - → less activity on the first weekend (Oct 06/07) than the second weekend (Oct 13/14)
   3. Focus on a specific entity and use this information to determine who has influence over them.
      - → dont know  

2. Clepper has noticed that people often communicate with (or about) the same people or vessels, and that grouping them together may help with the investigation.

   1. Use visual analytics to help Clepper understand and explore the interactions and relationships between vessels and people in the knowledge graph.
      - → see community graph
   2. Are there groups that are more closely associated? If so, what are the topic areas that are predominant for each group?

      - For example, these groupings could be related to: Environmentalism (known associates of Green Guardians), Sailor Shift, and fishing/leisure vessels.
      - → Nemo Reef: Unified Environment... and Himark Harbor: Centralized Mar... highly connected

3. It was noted by Clepper’s intern that some people and vessels are using pseudonyms to communicate.

   1. Expanding upon your prior visual analytics, determine who is using pseudonyms to communicate, and what these pseudonyms are.

      - Some that Clepper has already identified include: “Boss”, and “The Lookout”, but there appear to be many more.
      - To complicate the matter, pseudonyms may be used by multiple people or vessels.

   2. Describe how your visualizations make it easier for Clepper to identify common entities in the knowledge graph.
   3. How does your understanding of activities change given your understanding of pseudonyms?

4. Clepper suspects that Nadia Conti, who was formerly entangled in an illegal fishing scheme, may have continued illicit activity within Oceanus.

   1. Through visual analytics, provide evidence that Nadia is, or is not, doing something illegal.
   2. Summarize Nadia’s actions visually. Are Clepper’s suspicions justified?

### Reflection Questions

- Given the task to develop visualizations for knowledge graphs, did you find that the challenge pushed you to develop new techniques for visual representation?
- Did you participate in last year’s challenge? If so, did your experience last year help prepare you for this year’s challenge?
- What was the most difficult part of working on this year’s data and what could have made it more accessible?

**Note:** Please include a reasonable number of images, graphics, or figures with your responses to each question and keep your textual response brief.

## Milestones


Milestone 1: **Overview of the Data** (due 05/12/2025)

- (minimal) prepreocessioning of the data
- load it into a graph database

- **simple view of the whole graph in the frontend**

- sketch ideas
- think about milestones
- present these ideas in a short presentation ( 8+2 minutes )

Milestone 2: **Exploratory Analysis**

- based on first overview of the data, think about interesting subsets of the data for further analysis

Milestone 3: **Temporal Pattern Analysis**

Milestone 4: **Clustering and Grouping Analysis**

Milestone 5: **Investigation of Pseudonyms**

Milestone 6: **Investigation of Nadia Conti**
