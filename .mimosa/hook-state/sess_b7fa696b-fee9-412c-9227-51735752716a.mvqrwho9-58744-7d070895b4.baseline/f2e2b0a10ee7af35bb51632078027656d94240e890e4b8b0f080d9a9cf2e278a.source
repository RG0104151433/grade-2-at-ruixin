#include <iostream>
#include <vector>
#include <string>
#include <set>
#include <map>
#include <algorithm>
#include <cctype>

using namespace std;

map<char, int> var_map;
int var_count = 0;

int get_var_id(char c) {
    if (var_map.find(c) == var_map.end()) var_map[c] = ++var_count;
    return var_map[c];
}

bool is_tautology(const vector<int>& clause) {
    for (size_t i = 0; i < clause.size(); ++i)
        for (size_t j = i + 1; j < clause.size(); ++j)
            if (clause[i] == -clause[j]) return true;
    return false;
}

void commit_clause(set<vector<int>>& clauses, vector<int>& current_clause) {
    if (current_clause.empty()) return;
    sort(current_clause.begin(), current_clause.end());
    current_clause.erase(unique(current_clause.begin(), current_clause.end()), current_clause.end());
    if (!is_tautology(current_clause)) clauses.insert(current_clause);
    current_clause.clear();
}

int main() {
    string s;
    if (!(cin >> s)) return 0;

    set<vector<int>> clauses;
    vector<int> current_clause;
    bool neg = false;

    // ========== 解析 ==========
    for (char c : s) {
        if (c == '!') neg = true;
        else if (c == '&') commit_clause(clauses, current_clause);
        else if (isalpha(c)) {
            int id = get_var_id(c);
            current_clause.push_back(neg ? -id : id);
            neg = false;
        }
    }
    commit_clause(clauses, current_clause);

    // ========== 支持集策略初始化 ==========
    set<vector<int>> support = clauses;   // 初始全部放入支持集
    set<vector<int>> available;           // 可用集为空

    // ========== 主循环 ==========
    while (true) {
        // ---------- 第一阶段：单元消解（快速通道） ----------
        bool unit_progress = true;
        while (unit_progress) {
            unit_progress = false;
            vector<vector<int>> snapshot(clauses.begin(), clauses.end());
            vector<vector<int>> to_add;
            
            for (const auto& c1 : snapshot) {
                if (c1.size() != 1) continue;
                int ul = c1[0];
                for (const auto& c2 : snapshot) {
                    if (find(c2.begin(), c2.end(), -ul) == c2.end()) continue;
                    vector<int> nc;
                    for (int x : c2) if (x != -ul) nc.push_back(x);
                    if (nc.empty()) { cout << "NO" << endl; return 0; }
                    sort(nc.begin(), nc.end());
                    nc.erase(unique(nc.begin(), nc.end()), nc.end());
                    if (!is_tautology(nc) && clauses.find(nc) == clauses.end()
                        && find(to_add.begin(), to_add.end(), nc) == to_add.end())
                        to_add.push_back(nc);
                }
            }
            for (const auto& nc : to_add) {
                clauses.insert(nc);
                support.insert(nc); // 新子句也加入支持集
                unit_progress = true;
            }
        }

        // ---------- 第二阶段：支持集策略消解 ----------
        bool changed = false;
        vector<vector<int>> snap_S(support.begin(), support.end());
        vector<vector<int>> snap_A(available.begin(), available.end());
        vector<vector<int>> to_add;

        for (const auto& c1 : snap_S) {
            // 内层：c1 与 S 中其他子句
            for (const auto& c2 : snap_S) {
                if (&c1 == &c2) continue;
                bool resolved = false;
                for (int lit : c1) {
                    if (find(c2.begin(), c2.end(), -lit) != c2.end()) {
                        vector<int> nc;
                        for (int x : c1) if (x != lit) nc.push_back(x);
                        for (int x : c2) if (x != -lit) nc.push_back(x);
                        if (nc.empty()) { cout << "NO" << endl; return 0; }
                        sort(nc.begin(), nc.end());
                        nc.erase(unique(nc.begin(), nc.end()), nc.end());
                        if (!is_tautology(nc) && clauses.find(nc) == clauses.end()
                            && find(to_add.begin(), to_add.end(), nc) == to_add.end())
                            to_add.push_back(nc);
                        resolved = true;
                        break;
                    }
                }
                (void)resolved;
            }
            // 内层：c1 与 A 中子句
            for (const auto& c2 : snap_A) {
                for (int lit : c1) {
                    if (find(c2.begin(), c2.end(), -lit) != c2.end()) {
                        vector<int> nc;
                        for (int x : c1) if (x != lit) nc.push_back(x);
                        for (int x : c2) if (x != -lit) nc.push_back(x);
                        if (nc.empty()) { cout << "NO" << endl; return 0; }
                        sort(nc.begin(), nc.end());
                        nc.erase(unique(nc.begin(), nc.end()), nc.end());
                        if (!is_tautology(nc) && clauses.find(nc) == clauses.end()
                            && find(to_add.begin(), to_add.end(), nc) == to_add.end())
                            to_add.push_back(nc);
                        break;
                    }
                }
            }
        }

        for (const auto& nc : to_add) {
            clauses.insert(nc);
            support.insert(nc);
            changed = true;
        }

        if (!changed) break;
    }

    cout << "YES" << endl;
    return 0;
}