import React, { useContext, useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Spinner,
} from "react-bootstrap";
import Sidebar from "../MainPage/Sidebar";
import roomApi from "../../apis/room.api";
import { formatCurrency } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../../contexts/app.context";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { Room } from "../../types/room.type";

export default function ManagerPost() {
  const navigate = useNavigate();
  const { profile } = useContext(AppContext);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    rejected: 0,
    expired: 0,
  });
  const maxRetries = 3;

  useEffect(() => {
    if (profile?.id) {
      fetchRooms();
    }
  }, [profile?.id]);

  const fetchRooms = async (attempt = 1) => {
    if (!profile?.id) {
      setError("Bạn cần đăng nhập để xem danh sách phòng");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(
        `Fetching rooms for user ${profile.id}, attempt ${attempt}/${maxRetries}`
      );

      const response = await roomApi.getRoomOFUser();
      console.log("API response:", response.data);

      const roomsData = response.data.data.content as Room[];

      // Calculate stats from returned data
      const activeRooms = roomsData.filter(
        (room) => room.forGender === "ALL"
      ).length;
      const pendingRooms = roomsData.filter(
        (room) => room.forGender === "ALL"
      ).length;
      const rejectedRooms = roomsData.filter(
        (room) => room.forGender === "ALL"
      ).length;
      const expiredRooms = roomsData.filter(
        (room) => room.forGender === "ALL"
      ).length;

      setStats({
        total: roomsData.length,
        active: activeRooms,
        pending: pendingRooms,
        rejected: rejectedRooms,
        expired: expiredRooms,
      });

      setRooms(roomsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching rooms:", error);

      if (attempt < maxRetries) {
        const delay = 3000 + (attempt - 1) * 1000; // 3s, 4s, 5s
        console.warn(`Retrying in ${delay}ms...`);
        setTimeout(() => fetchRooms(attempt + 1), delay);
      } else {
        setError("Không thể tải danh sách phòng. Vui lòng thử lại sau.");
        setLoading(false);
      }
    }
  };

  const handleUpdate = (roomId: number) => {
    navigate(`/post-room/edit/${roomId}`);
  };

  const handleView = (roomId: number) => {
    window.location.href = `/phong-tro/${roomId}`;
  };

  const handleDelete = async (roomId: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tin đăng này không?")) {
      try {
        // Add API call for deleting room when available
        // await roomApi.deleteRoom(roomId);
        toast.success("Xóa tin đăng thành công");
        // Update room list after deletion
        setRooms(rooms.filter((room) => room.id !== roomId));

        // Update stats
        setStats((prev) => ({
          ...prev,
          total: prev.total - 1,
          // Decrease the corresponding status count
          active:
            rooms.find((r) => r.id === roomId)?.forGender === "ALL"
              ? prev.active - 1
              : prev.active,
          pending:
            rooms.find((r) => r.id === roomId)?.forGender === "ALL"
              ? prev.pending - 1
              : prev.pending,
          rejected:
            rooms.find((r) => r.id === roomId)?.forGender === "ALL"
              ? prev.rejected - 1
              : prev.rejected,
          expired:
            rooms.find((r) => r.id === roomId)?.forGender === "ALL"
              ? prev.expired - 1
              : prev.expired,
        }));
      } catch (error) {
        toast.error("Xóa tin đăng thất bại");
      }
    }
  };

  const getRoomTypeLabel = (roomType: string) => {
    switch (roomType) {
      case "APARTMENT":
        return "Căn hộ";
      case "WHOLE_HOUSE":
        return "Nhà nguyên căn";
      case "BOARDING_HOUSE":
        return "Phòng trọ";
      default:
        return roomType;
    }
  };

  const getStatusBadge = (status: string) => {
    let variant = "secondary";
    let label = status;

    switch (status) {
      case "ACTIVE":
        variant = "success";
        label = "Đang hoạt động";
        break;
      case "PENDING":
        variant = "warning";
        label = "Đang chờ duyệt";
        break;
      case "REJECTED":
        variant = "danger";
        label = "Bị từ chối";
        break;
      case "EXPIRED":
        variant = "secondary";
        label = "Hết hạn";
        break;
    }

    return <Badge bg={variant}>{label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <Container fluid className="p-0">
        <Row className="m-0" style={{ minHeight: "100vh" }}>
          <Col
            xs={12}
            md={3}
            lg={2}
            className="bg-light p-3 shadow-sm vh-100"
            style={{ width: "30%" }}
          >
            <Sidebar />
          </Col>
          <Col
            xs={12}
            md={9}
            lg={10}
            className="p-4 p-md-5 d-flex justify-content-center align-items-center"
            style={{ width: "70%" }}
          >
            <Spinner animation="border" variant="primary" />
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="p-0">
        <Row className="m-0" style={{ minHeight: "100vh" }}>
          <Col
            xs={12}
            md={3}
            lg={2}
            className="bg-light p-3 shadow-sm vh-100"
            style={{ width: "30%" }}
          >
            <Sidebar />
          </Col>
          <Col
            xs={12}
            md={9}
            lg={10}
            className="p-4 p-md-5"
            style={{ width: "70%" }}
          >
            <div className="alert alert-danger">
              {error}
              <Button
                variant="outline-danger"
                size="sm"
                className="ms-3"
                onClick={() => fetchRooms()}
              >
                Thử lại
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  const styles = {
    statCard: {
      height: "120px",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    statTitle: {
      fontSize: "1rem",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    statValue: {
      fontSize: "1.5rem",
      fontWeight: "bold",
    },
    pageTitle: {
      fontSize: "1.75rem",
    },
    sectionTitle: {
      fontSize: "1rem",
    },
    listingHeader: {
      fontSize: "1.25rem",
      fontWeight: "700",
    },
    ellipsis200: {
      maxWidth: "200px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    ellipsis150: {
      maxWidth: "150px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    tableContainer: {
      backgroundColor: "#fff",
      padding: "1rem",
      borderRadius: "0.5rem",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      marginBottom: "1.5rem",
    },
    noPostText: {
      color: "#6c757d",
      marginBottom: "1rem",
      fontSize: "1rem",
    },
    tableHeader: {
      backgroundColor: "#f8f9fa",
    },
    tableCell: {
      verticalAlign: "middle",
    },
  };

  return (
    <Container fluid className="p-0">
      <Row className="m-0" style={{ minHeight: "100vh" }}>
        {/* Sidebar */}
        <Col
          xs={12}
          md={3}
          lg={2}
          className="bg-light p-3 shadow-sm vh-100"
          style={{ width: "30%" }}
        >
          <Sidebar />
        </Col>

        {/* Main Content */}
        <Col
          xs={12}
          md={9}
          lg={10}
          className="p-4 p-md-5"
          style={{ width: "70%" }}
        >
          <h2 className="text-primary fw-bold mb-3" style={styles.pageTitle}>
            QUẢN LÝ TIN ĐĂNG
          </h2>
          <h5 className="fw-bold mb-4" style={styles.sectionTitle}>
            THỐNG KÊ TIN ĐĂNG
          </h5>

          {/* Statistics Cards */}
          <Row className="mb-4 gx-3">
            {/* Stats grid system - spread cards evenly across the full width */}
            <Col xs={12} sm={6} md={4} xl={2} className="mb-3">
              <Card
                className="text-white bg-primary rounded shadow h-100"
                style={{
                  transition: "transform 0.2s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Card.Body className="text-center p-3 d-flex flex-column justify-content-center">
                  <Card.Title style={styles.statTitle}>
                    Tổng tin đăng
                  </Card.Title>
                  <Card.Text style={styles.statValue}>{stats.total}</Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} md={4} xl={2} className="mb-3">
              <Card
                className="text-white bg-success rounded shadow h-100"
                style={{
                  transition: "transform 0.2s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Card.Body className="text-center p-3 d-flex flex-column justify-content-center">
                  <Card.Title style={styles.statTitle}>
                    Đang hoạt động
                  </Card.Title>
                  <Card.Text style={styles.statValue}>{stats.active}</Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} md={4} xl={2} className="mb-3">
              <Card
                className="text-white bg-warning rounded shadow h-100"
                style={{
                  transition: "transform 0.2s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Card.Body className="text-center p-3 d-flex flex-column justify-content-center">
                  <Card.Title style={styles.statTitle}>
                    Đang chờ duyệt
                  </Card.Title>
                  <Card.Text style={styles.statValue}>
                    {stats.pending}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} md={4} xl={2} className="mb-3">
              <Card
                className="text-white bg-danger rounded shadow h-100"
                style={{
                  transition: "transform 0.2s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Card.Body className="text-center p-3 d-flex flex-column justify-content-center">
                  <Card.Title style={styles.statTitle}>Bị từ chối</Card.Title>
                  <Card.Text style={styles.statValue}>
                    {stats.rejected}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} sm={6} md={4} xl={2} className="mb-3">
              <Card
                className="text-white bg-secondary rounded shadow h-100"
                style={{
                  transition: "transform 0.2s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Card.Body className="text-center p-3 d-flex flex-column justify-content-center">
                  <Card.Title style={styles.statTitle}>Hết hạn</Card.Title>
                  <Card.Text style={styles.statValue}>
                    {stats.expired}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

          </Row>

          {/* Room Listings */}

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3
              className="text-primary fw-bold mb-0"
              style={styles.listingHeader}
            >
              DANH SÁCH TIN ĐĂNG
            </h3>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => fetchRooms()}
              className="d-flex align-items-center"
            >
              <i className="fas fa-sync-alt me-2"></i> Làm mới
            </Button>
          </div>

          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              overflow: "hidden",
              marginBottom: "2rem",
            }}
          >
            {rooms.length === 0 ? (
              <div className="text-center py-5">
                <p style={styles.noPostText}>Bạn chưa có tin đăng nào</p>
                <Button
                  variant="primary"
                  onClick={() => navigate("/post-room")}
                >
                  Đăng tin mới
                </Button>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover responsive className="mb-0">
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#f8f9fa",
                        borderBottom: "2px solid #e9ecef",
                      }}
                    >
                      <th
                        style={{ width: "50px", padding: "12px 8px" }}
                        className="text-center"
                      >
                        #
                      </th>
                      <th style={{ padding: "12px 16px" }}>Tiêu đề</th>
                      <th style={{ padding: "12px 16px" }}>Giá</th>
                      <th style={{ padding: "12px 16px" }}>Diện tích</th>
                      <th style={{ padding: "12px 16px" }}>Loại</th>
                      <th style={{ padding: "12px 16px" }}>Địa điểm</th>
                      <th style={{ padding: "12px 16px" }}>Ngày đăng</th>
                      <th style={{ padding: "12px 16px" }}>Trạng thái</th>
                      <th
                        style={{ width: "150px", padding: "12px 16px" }}
                        className="text-center"
                      >
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room, index) => (
                      <tr
                        key={room.id}
                        style={{
                          borderBottom: "1px solid #e9ecef",
                          transition: "background-color 0.2s",
                        }}
                      >
                        <td
                          style={{ padding: "12px 8px" }}
                          className="text-center"
                        >
                          {index + 1}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div className="d-flex align-items-center">
                            {room.images && room.images.length > 0 ? (
                              <div
                                className="me-2 rounded"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  backgroundImage: `url(${room.images[0].imageUrl})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  flexShrink: 0,
                                }}
                              ></div>
                            ) : (
                              <div
                                className="me-2 rounded bg-light d-flex align-items-center justify-content-center"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  flexShrink: 0,
                                }}
                              >
                                <i className="fas fa-home text-secondary"></i>
                              </div>
                            )}
                            <div
                              style={{
                                maxWidth: "180px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontWeight: 500,
                              }}
                            >
                              {room.title}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="text-danger fw-bold">
                            {formatCurrency(room.price)} đ
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>{room.area} m²</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className="badge bg-light text-dark border">
                            {getRoomTypeLabel(room.roomType)}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div
                            style={{
                              maxWidth: "150px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {room.district
                              ? `${room.district}, ${room.province}`
                              : "Không có địa chỉ"}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontSize: "0.9rem" }}>
                            {formatDate(room.createdAt)}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {getStatusBadge(room.forGender || "ALL")}
                        </td>
                        <td
                          style={{ padding: "12px 16px" }}
                          className="text-center"
                        >
                          <div className="d-flex justify-content-center">
                            <Button
                              variant="light"
                              size="sm"
                              className="me-1 rounded-circle p-2"
                              title="Xem chi tiết"
                              onClick={() => handleView(room.id)}
                              style={{ width: "32px", height: "32px" }}
                            >
                              <FaEye size={14} />
                            </Button>
                            <Button
                              variant="light"
                              size="sm"
                              className="me-1 rounded-circle p-2"
                              title="Cập nhật"
                              onClick={() => handleUpdate(room.id)}
                              style={{ width: "32px", height: "32px" }}
                            >
                              <FaEdit size={14} />
                            </Button>
                            <Button
                              variant="light"
                              size="sm"
                              className="rounded-circle p-2"
                              title="Xóa"
                              onClick={() => handleDelete(room.id)}
                              style={{ width: "32px", height: "32px" }}
                            >
                              <FaTrash size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
}
