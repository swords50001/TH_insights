import { useEffect, useState } from "react";
import axios from "axios";

// Type definition for the card prop
interface Card {
  id: string;
  title: string;
  visualization_type: "metric" | "table";
}

// Type definition for data rows
type DataRow = Record<string, any>;

interface DashboardCardProps {
  card: Card;
}

export function DashboardCard({ card }: DashboardCardProps) {
  const [data, setData] = useState<DataRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.post<DataRow[]>(
          `/dashboard/cards/${card.id}/data`,
          {},
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        setData(res.data);
      } catch (err) {
        console.error("Error fetching card data:", err);
      }
    };

    fetchData();
  }, [card.id]);

  if (card.visualization_type === "metric") {
    return (
      <div className="card">
        <h3>{card.title}</h3>
        <p>{data[0]?.value ?? "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>{card.title}</h3>
      <table>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {Object.values(row).map((v, j) => (
                <td key={j}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
