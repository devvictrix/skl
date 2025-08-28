// frontend/src/pages/Home.tsx

import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNotification } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import {
  Typography,
  Container,
  Button,
  Pagination,
  Box,
  CircularProgress,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import PhotoSizeSelectActualIcon from "@mui/icons-material/PhotoSizeSelectActual";

interface Book {
  id: number;
  title: string;
  author: string;
  availableQuantity: number;
  quantity: number;
  coverImage?: string;
}
interface PaginatedBooksResponse {
  data: Book[];
  totalPages: number;
}

const Home = () => {
  const { showNotification } = useNotification();
  const { user } = useAuth();

  const [books, setBooks] = useState<Book[]>([]);
  const [borrowedBookIds, setBorrowedBookIds] = useState<Set<number>>(
    new Set()
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [titleSearch, setTitleSearch] = useState("");
  const [authorSearch, setAuthorSearch] = useState("");
  const limit = 10;

  const fetchData = async (page: number) => {
    setIsLoading(true);
    try {
      const [booksResponse, historyResponse] = await Promise.all([
        api.get<PaginatedBooksResponse>("/books", {
          params: {
            page,
            limit,
            title: titleSearch || undefined,
            author: authorSearch || undefined,
          },
        }),
        api.get<any[]>("/books/borrowed/history"),
      ]);

      setBooks(booksResponse.data.data);
      setTotalPages(booksResponse.data.totalPages);

      const userBorrowedIds = new Set(
        historyResponse.data
          .filter(
            (record) =>
              record.user.username === user?.username &&
              record.returnedAt === null
          )
          .map((record) => record.book.id)
      );
      setBorrowedBookIds(userBorrowedIds);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showNotification("Failed to load library data.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [titleSearch, authorSearch]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
  };

  const handleAction = async (
    action: "borrow" | "return",
    bookId: number,
    bookTitle: string
  ) => {
    try {
      await api.post(`/books/${bookId}/${action}`);
      showNotification(`Successfully ${action}ed "${bookTitle}"!`, "success");
      fetchData(currentPage);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || `Failed to ${action} book.`;
      showNotification(errorMessage, "error");
    }
  };

  const renderActionButtons = (book: Book) => {
    if (borrowedBookIds.has(book.id)) {
      return (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleAction("return", book.id, book.title)}
        >
          Return
        </Button>
      );
    }
    if (book.availableQuantity > 0) {
      return (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleAction("borrow", book.id, book.title)}
        >
          Borrow
        </Button>
      );
    }
    return (
      <Typography variant="caption" color="text.secondary">
        Unavailable
      </Typography>
    );
  };

  return (
    <Container sx={{ py: 4 }} maxWidth="lg">
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: "600" }}
      >
        Library Collection
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid xs={12} sm={5}>
          <TextField
            fullWidth
            label="Search by Title"
            variant="outlined"
            value={titleSearch}
            onChange={(e) => setTitleSearch(e.target.value)}
          />
        </Grid>
        <Grid xs={12} sm={5}>
          <TextField
            fullWidth
            label="Search by Author"
            variant="outlined"
            value={authorSearch}
            onChange={(e) => setAuthorSearch(e.target.value)}
          />
        </Grid>
        <Grid xs={12} sm={2}>
          <Button
            fullWidth
            variant="text"
            onClick={() => {
              setTitleSearch("");
              setAuthorSearch("");
            }}
            sx={{ height: "55px" }}
          >
            Clear Filters
          </Button>
        </Grid>
      </Grid>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ fontWeight: "bold", width: "100px" }}
                    align="center"
                  >
                    Cover
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Author</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">
                    Available
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {books.map((book) => (
                  <TableRow
                    key={book.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell align="center">
                      {book.coverImage ? (
                        <Box
                          component="img"
                          sx={{
                            height: 80,
                            width: 60,
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                          alt={book.title}
                          src={`http://localhost:3000${book.coverImage}`}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: 80,
                            width: 60,
                            backgroundColor: "grey.200",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "grey.500",
                            borderRadius: "4px",
                          }}
                        >
                          <PhotoSizeSelectActualIcon />
                        </Box>
                      )}
                    </TableCell>

                    <TableCell component="th" scope="row">
                      {book.title}
                    </TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell align="center">{`${book.availableQuantity} / ${book.quantity}`}</TableCell>
                    <TableCell align="center">
                      {renderActionButtons(book)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default Home;
