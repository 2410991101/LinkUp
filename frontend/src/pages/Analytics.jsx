
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";
import "./Analytics.css";

function Analytics() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("connectlyToken");

  const [contacts, setContacts] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const headers = {
        Authorization: `Bearer ${token}`
      };

      const [contactResponse, followResponse] = await Promise.all([
        fetch("/api/contacts", { headers }),
        fetch("/api/followups", { headers })
      ]);

      if (
        contactResponse.status === 401 ||
        followResponse.status === 401
      ) {
        sessionStorage.removeItem("connectlyToken");
        sessionStorage.removeItem("connectlyUser");
        navigate("/login");
        return;
      }

      if (!contactResponse.ok || !followResponse.ok) {
        throw new Error("Unable to load analytics data");
      }

      const contactData = await contactResponse.json();
      const followData = await followResponse.json();

      setContacts(
        Array.isArray(contactData)
          ? contactData
          : contactData.contacts || []
      );

      setFollowUps(
        Array.isArray(followData) ? followData : []
      );
    } catch (error) {
      console.error("Analytics loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalContacts = contacts.length;

  // COMPANY DISTRIBUTION

  const companies = useMemo(() => {
    const counts = {};

    contacts.forEach(contact => {
      const name = contact.company?.trim() || "Other";
      counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [contacts]);

  const totalCompanies = companies.length;

  // FOLLOW-UP STATUS

  const getStatus = item => {
    if (item.status === "Completed") return "Completed";

    const due = new Date(item.dueDate);
    const today = new Date();

    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return due < today ? "Overdue" : "Pending";
  };

  const completed = followUps.filter(
    item => getStatus(item) === "Completed"
  ).length;

  const pending = followUps.filter(
    item => getStatus(item) === "Pending"
  ).length;

  const overdue = followUps.filter(
    item => getStatus(item) === "Overdue"
  ).length;

  const pendingTotal = pending + overdue;

  // PERFORMANCE METRICS

  const currentMonth = new Date();
  const previousMonth = new Date();

  currentMonth.setDate(1);
  previousMonth.setDate(1);
  previousMonth.setMonth(previousMonth.getMonth() - 1);

  const currentMonthContacts = contacts.filter(contact => {
    if (!contact.createdAt) return false;

    const date = new Date(contact.createdAt);

    return (
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    );
  }).length;

  const previousMonthContacts = contacts.filter(contact => {
    if (!contact.createdAt) return false;

    const date = new Date(contact.createdAt);

    return (
      date.getMonth() === previousMonth.getMonth() &&
      date.getFullYear() === previousMonth.getFullYear()
    );
  }).length;

  const contactGrowth =
    previousMonthContacts > 0
      ? Math.round(
          ((currentMonthContacts - previousMonthContacts) /
            previousMonthContacts) * 100
        )
      : null;

  const followUpCompletionRate =
    followUps.length > 0
      ? Math.round((completed / followUps.length) * 100)
      : 0;

  const overdueRate =
    followUps.length > 0
      ? Math.round((overdue / followUps.length) * 100)
      : 0;

  // Data completeness: name, email, phone and company

  const completeContacts = contacts.filter(contact =>
    ["name", "email", "phone", "company"].every(field =>
      typeof contact[field] === "string" &&
      contact[field].trim() !== ""
    )
  ).length;

  const dataCompleteness =
    contacts.length > 0
      ? Math.round((completeContacts / contacts.length) * 100)
      : 0;

  const completionRate = followUps.length
    ? Math.round((completed / followUps.length) * 100)
    : 0;

  // CONTACT GROWTH - LAST 6 MONTHS

  const monthlyContacts = useMemo(() => {
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);

      months.push({
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString("en-IN", {
          month: "short"
        }),
        count: 0
      });
    }

    contacts.forEach(contact => {
      if (!contact.createdAt) return;

      const date = new Date(contact.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;

      const month = months.find(item => item.key === key);

      if (month) month.count++;
    });

    return months;
  }, [contacts]);

  // MONTHLY FOLLOW-UP ACTIVITY

  const monthlyActivity = useMemo(() => {
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);

      const year = date.getFullYear();
      const monthNumber = date.getMonth();

      const count = followUps.filter(item => {
        if (!item.createdAt) return false;

        const created = new Date(item.createdAt);

        return (
          created.getFullYear() === year &&
          created.getMonth() === monthNumber
        );
      }).length;

      months.push({
        label: date.toLocaleDateString("en-IN", {
          month: "short"
        }),
        count
      });
    }

    return months;
  }, [followUps]);

  // DYNAMIC SMART INSIGHTS

  const smartInsights = useMemo(() => {
    const insights = [];

    // Network growth insight
    if (contactGrowth !== null) {
      if (contactGrowth > 0) {
        insights.push({
          icon: "↗",
          title: "Network Growth",
          message: `Your network grew by ${contactGrowth}% compared to the previous month.`,
          type: "growth"
        });
      } else if (contactGrowth < 0) {
        insights.push({
          icon: "↘",
          title: "Network Growth",
          message: `Your network decreased by ${Math.abs(contactGrowth)}% compared to the previous month.`,
          type: "growth"
        });
      } else {
        insights.push({
          icon: "→",
          title: "Network Growth",
          message: "Your network size remained unchanged compared to the previous month.",
          type: "growth"
        });
      }
    } else {
      insights.push({
        icon: "✦",
        title: "Network Growth",
        message: "Add contacts across different months to start tracking network growth.",
        type: "growth"
      });
    }

    // Follow-up insight
    if (overdue > 0) {
      insights.push({
        icon: "◷",
        title: "Follow-up Alert",
        message: `You have ${overdue} overdue follow-up${overdue > 1 ? "s" : ""}. Prioritize reconnecting with these contacts.`,
        type: "warning"
      });
    } else if (followUps.length > 0) {
      insights.push({
        icon: "✓",
        title: "Follow-up Progress",
        message: "You have no overdue follow-ups. Keep maintaining your connections.",
        type: "success"
      });
    } else {
      insights.push({
        icon: "◷",
        title: "Follow-up Progress",
        message: "Schedule follow-ups to stay connected with your professional network.",
        type: "warning"
      });
    }

    // Contact data quality insight
    if (contacts.length > 0) {
      const incomplete = contacts.length - completeContacts;

      if (incomplete === 0) {
        insights.push({
          icon: "✦",
          title: "Data Quality",
          message: "All your contact profiles contain name, email, phone and company information.",
          type: "success"
        });
      } else {
        insights.push({
          icon: "!",
          title: "Data Quality",
          message: `${incomplete} of your ${contacts.length} contact profiles are incomplete. Fill in missing details for better contact management.`,
          type: "warning"
        });
      }
    } else {
      insights.push({
        icon: "✦",
        title: "Data Quality",
        message: "Start adding contacts with complete details to build a reliable network database.",
        type: "success"
      });
    }

    // Monthly activity insight
    const mostActiveMonth = monthlyActivity.reduce(
      (best, month) => month.count > best.count ? month : best,
      { label: "-", count: 0 }
    );

    if (mostActiveMonth.count > 0) {
      insights.push({
        icon: "★",
        title: "Activity Highlight",
        message: `${mostActiveMonth.label} was your most active month with ${mostActiveMonth.count} follow-up${mostActiveMonth.count > 1 ? "s" : ""} created.`,
        type: "activity"
      });
    } else {
      insights.push({
        icon: "★",
        title: "Activity Highlight",
        message: "Your monthly activity insights will appear once you schedule follow-ups.",
        type: "activity"
      });
    }

    return insights;
  }, [
    contactGrowth,
    overdue,
    followUps.length,
    contacts.length,
    completeContacts,
    monthlyActivity
  ]);

  const maxContacts = Math.max(
    ...monthlyContacts.map(item => item.count),
    1
  );

  const maxActivity = Math.max(
    ...monthlyActivity.map(item => item.count),
    1
  );

  const chartPoints = monthlyContacts
    .map((item, index) => {
      const x = 35 + index * 70;
      const y = 145 - (item.count / maxContacts) * 110;

      return `${x},${y}`;
    })
    .join(" ");

  // FOLLOW-UP DONUT

  const donutGradient = followUps.length
    ? `conic-gradient(
        #8b6be8 0% ${completed / followUps.length * 100}%,
        #f3a6c9 ${completed / followUps.length * 100}% ${(completed + pending) / followUps.length * 100}%,
        #f1a27e ${(completed + pending) / followUps.length * 100}% 100%
      )`
    : "conic-gradient(#eee9f6 0% 100%)";

  const companyColors = [
    "#8b6be8",
    "#e9a4c8",
    "#79b9a5",
    "#f1a27e",
    "#8eb8e8",
    "#b7a4dc"
  ];


  // EXPORT ANALYTICS REPORT
  const exportAnalytics = () => {
    const report = [
      ["Connectly Analytics Report"],
      ["Generated On", new Date().toLocaleDateString()],
      [],
      ["Metric", "Value"],
      ["Total Contacts", contacts.length],
      ["Total Companies", totalCompanies],
      ["Total Follow-ups", followUps.length],
      ["Completed Follow-ups", completed],
      ["Pending Follow-ups", pending],
      ["Overdue Follow-ups", overdue],
      ["Follow-up Completion Rate", `${followUpCompletionRate}%`],
      ["Overdue Rate", `${overdueRate}%`],
      ["Complete Contact Profiles", completeContacts],
      ["Contact Data Completeness", `${dataCompleteness}%`],
      ["Monthly Contact Growth", contactGrowth === null ? "N/A" : `${contactGrowth}%`],
      [],
      ["Company", "Contact Count"],
      ...companies.map(company => [company.name, company.count])
    ];

    const csvContent = report
      .map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Connectly-Analytics-Report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <Sidebar />

      <main className="main-content">
        <div className="analytics-page">

          {/* HEADER */}

          <div className="analytics-heading">
            <div>
              <p className="analytics-eyebrow">
                YOUR NETWORK INSIGHTS
              </p>

              <h1>Analytics</h1>

              <p>
                Understand your connections and track your networking activity.
              </p>
            </div>

            <button
              className="analytics-refresh-btn"
              onClick={loadAnalytics}
            >
              ↻ Refresh data
            </button>

            <button
              className="analytics-export-btn"
              onClick={exportAnalytics}
              disabled={loading}
            >
              ↓ Export Report
            </button>
          </div>

          {loading ? (
            <div className="analytics-loading">
              Loading your analytics...
            </div>
          ) : (
            <>
              {/* PERFORMANCE KPI CARDS */}

              <section className="analytics-performance">

                <div className="performance-card growth-performance">
                  <div className="performance-card-top">
                    <span>Contact Growth</span>
                    <span className="performance-icon">↗</span>
                  </div>

                  <h2>
                    {contactGrowth === null
                      ? "N/A"
                      : `${contactGrowth > 0 ? "+" : ""}${contactGrowth}%`}
                  </h2>

                  <p>
                    {contactGrowth === null
                      ? "No previous month baseline"
                      : "Compared to previous month"}
                  </p>
                </div>

                <div className="performance-card completion-performance">
                  <div className="performance-card-top">
                    <span>Follow-up Efficiency</span>
                    <span className="performance-icon">✓</span>
                  </div>

                  <h2>{followUpCompletionRate}%</h2>

                  <p>Follow-ups completed</p>
                </div>

                <div className="performance-card overdue-performance">
                  <div className="performance-card-top">
                    <span>Overdue Rate</span>
                    <span className="performance-icon">◷</span>
                  </div>

                  <h2>{overdueRate}%</h2>

                  <p>Follow-ups overdue</p>
                </div>

                <div className="performance-card quality-performance">
                  <div className="performance-card-top">
                    <span>Data Completeness</span>
                    <span className="performance-icon">✦</span>
                  </div>

                  <h2>{dataCompleteness}%</h2>

                  <p>Complete contact profiles</p>
                </div>

              </section>

              {/* ORIGINAL STAT CARDS */}

              <section className="analytics-stats">

                <div className="analytics-stat-card">
                  <div className="analytics-stat-top">
                    <span className="analytics-stat-icon purple">
                      ♧
                    </span>

                    <span className="analytics-stat-tag">
                      Network
                    </span>
                  </div>

                  <p>Total Contacts</p>
                  <h2>{totalContacts}</h2>
                  <small>Your professional connections</small>
                </div>

                <div className="analytics-stat-card">
                  <div className="analytics-stat-top">
                    <span className="analytics-stat-icon pink">
                      ▤
                    </span>

                    <span className="analytics-stat-tag">
                      Organisations
                    </span>
                  </div>

                  <p>Companies</p>
                  <h2>{totalCompanies}</h2>
                  <small>Unique companies in your network</small>
                </div>

                <div className="analytics-stat-card">
                  <div className="analytics-stat-top">
                    <span className="analytics-stat-icon green">
                      ✓
                    </span>

                    <span className="analytics-stat-tag">
                      Activity
                    </span>
                  </div>

                  <p>Total Follow-ups</p>
                  <h2>{followUps.length}</h2>
                  <small>All scheduled conversations</small>
                </div>

                <div className="analytics-stat-card">
                  <div className="analytics-stat-top">
                    <span className="analytics-stat-icon orange">
                      ◷
                    </span>

                    <span className="analytics-stat-tag">
                      To do
                    </span>
                  </div>

                  <p>Pending Follow-ups</p>
                  <h2>{pendingTotal}</h2>
                  <small>Pending and overdue tasks</small>
                </div>

              </section>

              {/* CHARTS */}

              <section className="analytics-charts-grid">

                {/* CONTACT GROWTH */}

                <div className="analytics-card growth-card">
                  <div className="analytics-card-heading">
                    <div>
                      <h2>Contacts Growth</h2>
                      <p>New contacts added over the last 6 months</p>
                    </div>

                    <span className="analytics-chart-label">
                      Last 6 months
                    </span>
                  </div>

                  {totalContacts === 0 ? (
                    <div className="analytics-empty">
                      Add contacts to see your growth chart.
                    </div>
                  ) : (
                    <div className="line-chart">
                      <div className="line-chart-grid">
                        {[0, 1, 2, 3].map(item => (
                          <div
                            className="line-grid-line"
                            key={item}
                          ></div>
                        ))}
                      </div>

                      <svg
                        viewBox="0 0 420 175"
                        preserveAspectRatio="none"
                        className="growth-svg"
                      >
                        <polyline
                          points={chartPoints}
                          fill="none"
                          stroke="#8b6be8"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {monthlyContacts.map((item, index) => {
                          const x = 35 + index * 70;
                          const y =
                            145 - (item.count / maxContacts) * 110;

                          return (
                            <circle
                              key={item.key}
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#ffffff"
                              stroke="#8b6be8"
                              strokeWidth="3"
                            />
                          );
                        })}
                      </svg>

                      <div className="chart-month-labels">
                        {monthlyContacts.map(item => (
                          <span key={item.key}>
                            {item.label}
                          </span>
                        ))}
                      </div>

                      <div className="growth-month-values">
                        {monthlyContacts.map(item => (
                          <span key={item.key}>
                            {item.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* COMPANY DISTRIBUTION */}

                <div className="analytics-card company-card">
                  <div className="analytics-card-heading">
                    <div>
                      <h2>Company Distribution</h2>
                      <p>Where your contacts work</p>
                    </div>
                  </div>

                  {companies.length === 0 ? (
                    <div className="analytics-empty">
                      Add company details to see distribution.
                    </div>
                  ) : (
                    <>
                      <div className="company-chart-area">
                        <div className="company-donut">
                          <div
                            className="company-donut-inner"
                            style={{ background: donutGradient }}
                          >
                            <div className="company-donut-center">
                              <strong>{totalContacts}</strong>
                              <span>Contacts</span>
                            </div>
                          </div>
                        </div>

                        <div className="company-legend">
                          {companies.slice(0, 6).map((item, index) => (
                            <div
                              className="company-legend-item"
                              key={item.name}
                            >
                              <span
                                className="company-legend-dot"
                                style={{
                                  background: companyColors[index]
                                }}
                              ></span>

                              <span className="company-legend-name">
                                {item.name}
                              </span>

                              <strong>{item.count}</strong>
                            </div>
                          ))}
                        </div>
                      </div>

                      {companies.length > 6 && (
                        <p className="analytics-note">
                          Showing the top 6 companies.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* FOLLOW-UP STATUS */}

                <div className="analytics-card status-card">
                  <div className="analytics-card-heading">
                    <div>
                      <h2>Follow-up Status</h2>
                      <p>Track your conversation progress</p>
                    </div>
                  </div>

                  {followUps.length === 0 ? (
                    <div className="analytics-empty">
                      Your follow-up status will appear here.
                    </div>
                  ) : (
                    <>
                      <div className="status-chart-area">
                        <div
                          className="status-donut"
                          style={{ background: donutGradient }}
                        >
                          <div className="status-donut-inner">
                            <strong>{completionRate}%</strong>
                            <span>Completed</span>
                          </div>
                        </div>

                        <div className="status-legend">
                          <div>
                            <span className="status-dot completed-dot"></span>
                            <span>Completed</span>
                            <strong>{completed}</strong>
                          </div>

                          <div>
                            <span className="status-dot pending-dot"></span>
                            <span>Pending</span>
                            <strong>{pending}</strong>
                          </div>

                          <div>
                            <span className="status-dot overdue-dot"></span>
                            <span>Overdue</span>
                            <strong>{overdue}</strong>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* MONTHLY ACTIVITY */}

                <div className="analytics-card activity-card">
                  <div className="analytics-card-heading">
                    <div>
                      <h2>Monthly Activity</h2>
                      <p>Follow-ups created each month</p>
                    </div>

                    <span className="analytics-chart-label">
                      Last 6 months
                    </span>
                  </div>

                  <div className="activity-chart">
                    {monthlyActivity.map((item, index) => (
                      <div
                        className="activity-bar-group"
                        key={`${item.label}-${index}`}
                      >
                        <strong>{item.count}</strong>

                        <div className="activity-bar-track">
                          <div
                            className="activity-bar"
                            style={{
                              height: `${Math.max(
                                (item.count / maxActivity) * 100,
                                item.count ? 8 : 0
                              )}%`
                            }}
                          ></div>
                        </div>

                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </section>

              {/* NETWORK INSIGHT */}

              <section className="analytics-insights-grid">
  {smartInsights.map((insight, index) => (
    <div
      className={`smart-insight-card ${insight.type}`}
      key={index}
    >
      <div className="smart-insight-icon">
        {insight.icon}
      </div>

      <div className="smart-insight-content">
        <h3>{insight.title}</h3>
        <p>{insight.message}</p>
      </div>
    </div>
  ))}
</section>
<section className="analytics-efficiency">
  <div className="efficiency-header">
    <div>
      <span className="efficiency-tag">PERFORMANCE TRACKER</span>
      <h2>Follow-up Efficiency</h2>
      <p>Monitor how effectively you manage your professional connections.</p>
    </div>
    <div className="efficiency-badge">✦ Insights</div>
  </div>

  <div className="efficiency-metrics">

    <div className="efficiency-item">
      <div className="efficiency-top">
        <span>Follow-up Completion</span>
        <strong>{followUpCompletionRate}%</strong>
      </div>
      <div className="efficiency-track">
        <div
          className="efficiency-fill purple-fill"
          style={{ width: `${followUpCompletionRate}%` }}
        ></div>
      </div>
      <p>{completed} completed out of {followUps.length} follow-ups</p>
    </div>

    <div className="efficiency-item">
      <div className="efficiency-top">
        <span>Contact Data Quality</span>
        <strong>{dataCompleteness}%</strong>
      </div>
      <div className="efficiency-track">
        <div
          className="efficiency-fill green-fill"
          style={{ width: `${dataCompleteness}%` }}
        ></div>
      </div>
      <p>{completeContacts} complete profiles out of {contacts.length} contacts</p>
    </div>

    <div className="efficiency-item">
      <div className="efficiency-top">
        <span>Overdue Follow-ups</span>
        <strong>{overdueRate}%</strong>
      </div>
      <div className="efficiency-track">
        <div
          className="efficiency-fill orange-fill"
          style={{ width: `${overdueRate}%` }}
        ></div>
      </div>
      <p>{overdue} overdue follow-ups out of {followUps.length} total</p>
    </div>

  </div>
</section>

              {/* FOOTER */}

              <div className="analytics-footer">
                Analytics based on your saved LinkUp data.
              </div>

            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Analytics;
